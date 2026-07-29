package com.example.constructionestimator

import android.content.Context
import android.graphics.Bitmap
import android.graphics.RectF
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.support.common.FileUtil
import org.tensorflow.lite.support.image.TensorImage
import org.tensorflow.lite.support.tensorbuffer.TensorBuffer
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel

/**
 * Object Detector using TensorFlow Lite
 * Detects construction objects in images for cost estimation
 */
class ObjectDetector(private val context: Context) {
    
    companion object {
        private const val MODEL_FILE = "ssd_mobilenet_v1.tflite"
        private const val LABELS_FILE = "labels.txt"
        private const val INPUT_SIZE = 300
        private const val NUM_DETECTIONS = 10
        private const val CONFIDENCE_THRESHOLD = 0.5f
    }
    
    private var interpreter: Interpreter? = null
    private var labels: List<String> = emptyList()
    private var isInitialized = false
    
    data class DetectionResult(
        val label: String,
        val confidence: Float,
        val boundingBox: RectF,
        val estimatedCost: Float = 0f
    )
    
    /**
     * Initialize the detector - call this before detect()
     */
    fun initialize(): Boolean {
        return try {
            val model = loadModelFile()
            val options = Interpreter.Options().apply {
                setNumThreads(4)
            }
            interpreter = Interpreter(model, options)
            labels = loadLabels()
            isInitialized = true
            true
        } catch (e: Exception) {
            e.printStackTrace()
            isInitialized = false
            false
        }
    }
    
    private fun loadModelFile(): MappedByteBuffer {
        val assetFileDescriptor = context.assets.openFd(MODEL_FILE)
        return assetFileDescriptor.use { afd ->
            FileInputStream(afd.fileDescriptor).use { inputStream ->
                val fileChannel = inputStream.channel
                val startOffset = afd.startOffset
                val declaredLength = afd.declaredLength
                fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength)
            }
        }
    }
    
    private fun loadLabels(): List<String> {
        return try {
            context.assets.open(LABELS_FILE).bufferedReader().readLines()
        } catch (e: Exception) {
            // Default construction labels if file not found
            listOf(
                "background",
                "foundation",
                "wall",
                "window",
                "door",
                "roof",
                "floor",
                "pipe",
                "wire",
                "concrete",
                "brick",
                "metal",
                "wood",
                "insulation"
            )
        }
    }
    
    /**
     * Detect objects in the given bitmap
     */
    fun detect(bitmap: Bitmap): List<DetectionResult> {
        if (!isInitialized || interpreter == null) {
            // Try to initialize if not done
            if (!initialize()) {
                return emptyList()
            }
        }
        
        // Prepare input
        val resizedBitmap = Bitmap.createScaledBitmap(bitmap, INPUT_SIZE, INPUT_SIZE, true)
        val inputBuffer = convertBitmapToByteBuffer(resizedBitmap)
        // Recycle scaled bitmap to prevent memory leak (W-8)
        if (resizedBitmap != bitmap) {
            resizedBitmap.recycle()
        }
        
        // Prepare output arrays
        val outputLocations = Array(1) { Array(NUM_DETECTIONS) { FloatArray(4) } }
        val outputClasses = Array(1) { FloatArray(NUM_DETECTIONS) }
        val outputScores = Array(1) { FloatArray(NUM_DETECTIONS) }
        val numDetections = FloatArray(1)
        
        val outputs = mapOf(
            0 to outputLocations,
            1 to outputClasses,
            2 to outputScores,
            3 to numDetections
        )
        
        // Run inference
        interpreter?.runForMultipleInputsOutputs(arrayOf(inputBuffer), outputs)
        
        // Parse results
        val results = mutableListOf<DetectionResult>()
        val numDetected = numDetections[0].toInt().coerceAtMost(NUM_DETECTIONS)
        
        for (i in 0 until numDetected) {
            val confidence = outputScores[0][i]
            if (confidence >= CONFIDENCE_THRESHOLD) {
                val classIdx = outputClasses[0][i].toInt()
                val label = if (classIdx < labels.size) labels[classIdx] else "unknown"
                
                val box = RectF(
                    outputLocations[0][i][1] * bitmap.width,
                    outputLocations[0][i][0] * bitmap.height,
                    outputLocations[0][i][3] * bitmap.width,
                    outputLocations[0][i][2] * bitmap.height
                )
                
                val estimatedCost = calculateCost(label, box)
                
                results.add(DetectionResult(label, confidence, box, estimatedCost))
            }
        }
        
        return results
    }
    
    private fun convertBitmapToByteBuffer(bitmap: Bitmap): ByteBuffer {
        val byteBuffer = ByteBuffer.allocateDirect(4 * INPUT_SIZE * INPUT_SIZE * 3)
        byteBuffer.order(ByteOrder.nativeOrder())
        
        val pixels = IntArray(INPUT_SIZE * INPUT_SIZE)
        bitmap.getPixels(pixels, 0, INPUT_SIZE, 0, 0, INPUT_SIZE, INPUT_SIZE)
        
        for (pixel in pixels) {
            val r = (pixel shr 16 and 0xFF) / 255.0f
            val g = (pixel shr 8 and 0xFF) / 255.0f
            val b = (pixel and 0xFF) / 255.0f
            byteBuffer.putFloat(r)
            byteBuffer.putFloat(g)
            byteBuffer.putFloat(b)
        }
        
        return byteBuffer
    }
    
    /**
     * Calculate estimated cost based on detected object
     */
    private fun calculateCost(label: String, box: RectF): Float {
        val area = box.width() * box.height()
        val basePrice = when (label.lowercase()) {
            "foundation" -> 5000f
            "wall" -> 3000f
            "window" -> 15000f
            "door" -> 12000f
            "roof" -> 8000f
            "floor" -> 2500f
            "pipe" -> 500f
            "wire" -> 200f
            "concrete" -> 4500f
            "brick" -> 800f
            "metal" -> 1500f
            "wood" -> 1200f
            "insulation" -> 600f
            else -> 1000f
        }
        // Scale price by relative area (normalized)
        return basePrice * (area / 10000f).coerceIn(0.5f, 5f)
    }
    
    /**
     * Release resources
     */
    fun close() {
        interpreter?.close()
        interpreter = null
        isInitialized = false
    }
}
