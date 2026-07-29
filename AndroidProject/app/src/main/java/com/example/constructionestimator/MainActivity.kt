package com.example.constructionestimator

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Bundle
import android.util.Size
import android.view.View
import android.widget.Button
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import java.io.File
import java.text.NumberFormat
import java.util.*
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class MainActivity : AppCompatActivity() {
    
    private lateinit var previewView: PreviewView
    private lateinit var imageView: ImageView
    private lateinit var captureButton: Button
    private lateinit var analyzeButton: Button
    private lateinit var resultText: TextView
    private lateinit var totalCostText: TextView
    private lateinit var detectedList: RecyclerView
    
    // New buttons
    private var savePdfButton: Button? = null
    private var shareButton: Button? = null
    private var historyButton: ImageButton? = null
    
    private var imageCapture: ImageCapture? = null
    private lateinit var cameraExecutor: ExecutorService
    private lateinit var objectDetector: ObjectDetector
    private var capturedBitmap: Bitmap? = null
    
    // Store last results for PDF/history
    private var lastResults: List<ObjectDetector.DetectionResult> = emptyList()
    private var lastPdfFile: File? = null
    
    private val currencyFormat = NumberFormat.getCurrencyInstance(Locale("ru", "RU"))

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        initViews()
        cameraExecutor = Executors.newSingleThreadExecutor()
        initDetector()
        
        if (allPermissionsGranted()) {
            startCamera()
        } else {
            ActivityCompat.requestPermissions(
                this, REQUIRED_PERMISSIONS, REQUEST_CODE_PERMISSIONS
            )
        }
    }
    
    private fun initViews() {
        previewView = findViewById(R.id.previewView)
        imageView = findViewById(R.id.imageView)
        captureButton = findViewById(R.id.captureButton)
        analyzeButton = findViewById(R.id.analyzeButton)
        resultText = findViewById(R.id.resultText)
        totalCostText = findViewById(R.id.totalCostText)
        detectedList = findViewById(R.id.detectedList)
        
        // Optional buttons (may not exist in old layout)
        savePdfButton = findViewById(R.id.savePdfButton)
        shareButton = findViewById(R.id.shareButton)
        historyButton = findViewById(R.id.historyButton)
        
        captureButton.setOnClickListener { takePhoto() }
        analyzeButton.setOnClickListener { analyzeImage() }
        
        savePdfButton?.setOnClickListener { saveToPdf() }
        shareButton?.setOnClickListener { sharePdf() }
        historyButton?.setOnClickListener { openHistory() }
        
        detectedList.layoutManager = LinearLayoutManager(this)
    }
    
    private fun initDetector() {
        objectDetector = ObjectDetector(this)
        // Initialize in background
        cameraExecutor.execute {
            val success = objectDetector.initialize()
            runOnUiThread {
                if (!success) {
                    Toast.makeText(
                        this,
                        "⚠️ AI модель не загружена. Добавьте ssd_mobilenet_v1.tflite в assets",
                        Toast.LENGTH_LONG
                    ).show()
                }
            }
        }
    }

    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        cameraProviderFuture.addListener({
            val cameraProvider: ProcessCameraProvider = cameraProviderFuture.get()

            val preview = Preview.Builder()
                .build()
                .also { it.setSurfaceProvider(previewView.surfaceProvider) }

            imageCapture = ImageCapture.Builder()
                .setTargetResolution(Size(1280, 720))
                .build()

            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

            try {
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(
                    this, cameraSelector, preview, imageCapture
                )
            } catch (exc: Exception) {
                Toast.makeText(this, "Ошибка запуска камеры: ${exc.message}", Toast.LENGTH_SHORT).show()
            }

        }, ContextCompat.getMainExecutor(this))
    }

    private fun takePhoto() {
        val imageCapture = imageCapture ?: return
        
        val photoFile = File.createTempFile("photo_", ".jpg", cacheDir)
        val outputOptions = ImageCapture.OutputFileOptions.Builder(photoFile).build()

        imageCapture.takePicture(
            outputOptions,
            ContextCompat.getMainExecutor(this),
            object : ImageCapture.OnImageSavedCallback {
                override fun onError(exc: ImageCaptureException) {
                    Toast.makeText(this@MainActivity, "Ошибка съёмки: ${exc.message}", Toast.LENGTH_SHORT).show()
                }

                override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                    // Load and display the captured image
                    capturedBitmap = BitmapFactory.decodeFile(photoFile.absolutePath)
                    capturedBitmap?.let { bitmap ->
                        imageView.setImageBitmap(bitmap)
                        imageView.visibility = View.VISIBLE
                        analyzeButton.visibility = View.VISIBLE
                        
                        // Hide PDF buttons until analysis is done
                        savePdfButton?.visibility = View.GONE
                        shareButton?.visibility = View.GONE
                        
                        Toast.makeText(this@MainActivity, "✅ Фото сделано! Нажмите 'Анализ'", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        )
    }
    
    private fun analyzeImage() {
        val bitmap = capturedBitmap ?: run {
            Toast.makeText(this, "Сначала сделайте фото!", Toast.LENGTH_SHORT).show()
            return
        }
        
        resultText.visibility = View.VISIBLE
        resultText.text = "🔍 Анализируем изображение..."
        
        cameraExecutor.execute {
            val results = objectDetector.detect(bitmap)
            
            runOnUiThread {
                if (results.isEmpty()) {
                    resultText.text = "Объекты не обнаружены.\nПопробуйте сфотографировать строительный объект."
                    totalCostText.visibility = View.GONE
                    savePdfButton?.visibility = View.GONE
                    shareButton?.visibility = View.GONE
                } else {
                    lastResults = results
                    displayResults(results)
                    
                    // Save to history
                    AnalysisHistory.save(this, results)
                    
                    // Show PDF buttons
                    savePdfButton?.visibility = View.VISIBLE
                }
            }
        }
    }
    
    private fun displayResults(results: List<ObjectDetector.DetectionResult>) {
        val sb = StringBuilder()
        sb.append("🏗️ Обнаружено объектов: ${results.size}\n\n")
        
        var totalCost = 0f
        
        results.forEachIndexed { index, result ->
            sb.append("${index + 1}. ${result.label.replaceFirstChar { it.uppercase() }}\n")
            sb.append("   Уверенность: ${(result.confidence * 100).toInt()}%\n")
            sb.append("   Стоимость: ${currencyFormat.format(result.estimatedCost)}\n\n")
            totalCost += result.estimatedCost
        }
        
        resultText.text = sb.toString()
        resultText.visibility = View.VISIBLE
        
        totalCostText.text = "💰 Итого: ${currencyFormat.format(totalCost)}"
        totalCostText.visibility = View.VISIBLE
        
        detectedList.visibility = View.VISIBLE
    }
    
    private fun saveToPdf() {
        if (lastResults.isEmpty()) {
            Toast.makeText(this, "Сначала выполните анализ!", Toast.LENGTH_SHORT).show()
            return
        }
        
        cameraExecutor.execute {
            val file = PdfGenerator.generate(this, lastResults, capturedBitmap)
            runOnUiThread {
                if (file != null) {
                    lastPdfFile = file
                    shareButton?.visibility = View.VISIBLE
                    
                    // Offer to open
                    PdfGenerator.open(this, file)
                }
            }
        }
    }
    
    private fun sharePdf() {
        val file = lastPdfFile
        if (file == null || !file.exists()) {
            Toast.makeText(this, "Сначала сохраните PDF!", Toast.LENGTH_SHORT).show()
            saveToPdf()
            return
        }
        PdfGenerator.share(this, file)
    }
    
    private fun openHistory() {
        val intent = Intent(this, HistoryActivity::class.java)
        startActivity(intent)
    }

    private fun allPermissionsGranted() = REQUIRED_PERMISSIONS.all {
        ContextCompat.checkSelfPermission(baseContext, it) == PackageManager.PERMISSION_GRANTED
    }

    override fun onRequestPermissionsResult(
        requestCode: Int, permissions: Array<String>, grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_CODE_PERMISSIONS) {
            if (allPermissionsGranted()) {
                startCamera()
            } else {
                Toast.makeText(this, "Для работы приложения нужен доступ к камере", Toast.LENGTH_LONG).show()
                finish()
            }
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
        objectDetector.close()
    }

    companion object {
        private const val REQUEST_CODE_PERMISSIONS = 10
        private val REQUIRED_PERMISSIONS = arrayOf(Manifest.permission.CAMERA)
    }
}
