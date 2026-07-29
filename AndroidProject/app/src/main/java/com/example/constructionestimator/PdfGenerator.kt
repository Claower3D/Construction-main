package com.example.constructionestimator

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.pdf.PdfDocument
import android.os.Environment
import android.widget.Toast
import androidx.core.content.FileProvider
import java.io.File
import java.io.FileOutputStream
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.*

/**
 * PDF Generator for construction estimate reports
 */
object PdfGenerator {

    private val currencyFormat = NumberFormat.getCurrencyInstance(Locale("ru", "RU"))
    private val dateFormat = SimpleDateFormat("dd.MM.yyyy HH:mm", Locale.getDefault())

    /**
     * Generate PDF report from detection results
     */
    fun generate(
        context: Context,
        results: List<ObjectDetector.DetectionResult>,
        capturedImage: Bitmap? = null
    ): File? {
        return try {
            val document = PdfDocument()
            
            drawContent(document, results, capturedImage)

            // Save to file
            val file = createPdfFile(context)
            FileOutputStream(file).use { outputStream ->
                document.writeTo(outputStream)
            }
            document.close()

            Toast.makeText(context, "✅ PDF сохранён: ${file.name}", Toast.LENGTH_SHORT).show()
            file
        } catch (e: Exception) {
            e.printStackTrace()
            Toast.makeText(context, "❌ Ошибка создания PDF: ${e.message}", Toast.LENGTH_LONG).show()
            null
        }
    }

    private fun drawContent(
        document: PdfDocument,
        results: List<ObjectDetector.DetectionResult>,
        capturedImage: Bitmap?
    ) {
        val paint = Paint().apply {
            isAntiAlias = true
        }

        // Page management helper
        var pageNumber = 1
        val PAGE_WIDTH = 595
        val PAGE_HEIGHT = 842
        val MARGIN_TOP = 40f
        val MARGIN_BOTTOM = 60f // Leave space for footer
        val PAGE_BOTTOM = PAGE_HEIGHT - MARGIN_BOTTOM

        fun startNewPage(): Canvas {
            val pageInfo = PdfDocument.PageInfo.Builder(PAGE_WIDTH, PAGE_HEIGHT, pageNumber).create()
            pageNumber++
            return document.startPage(pageInfo).canvas
        }

        var canvas = startNewPage()
        var yPos = MARGIN_TOP

        // Check and handle page overflow
        fun ensureSpace(needed: Float): Canvas {
            if (yPos + needed > PAGE_BOTTOM) {
                // Draw footer on current page
                paint.apply {
                    color = Color.GRAY
                    textSize = 9f
                    isFakeBoldText = false
                }
                canvas.drawText("Страница ${pageNumber - 1}", 500f, 830f, paint)
                
                // Finish current page and start a new one
                document.finishPage(document.pages.last())
                canvas = startNewPage()
                yPos = MARGIN_TOP
            }
            return canvas
        }

        // Header
        paint.apply {
            color = Color.parseColor("#1E88E5")
            textSize = 24f
            isFakeBoldText = true
        }
        canvas.drawText("🏗️ Смета строительных работ", 40f, yPos, paint)
        yPos += 30f

        // Date
        paint.apply {
            color = Color.GRAY
            textSize = 12f
            isFakeBoldText = false
        }
        canvas.drawText("Дата: ${dateFormat.format(Date())}", 40f, yPos, paint)
        yPos += 40f

        // Draw captured image thumbnail if available
        capturedImage?.let { bitmap ->
            canvas = ensureSpace(170f)
            val scaledBitmap = Bitmap.createScaledBitmap(bitmap, 200, 150, true)
            canvas.drawBitmap(scaledBitmap, 40f, yPos, paint)
            if (scaledBitmap != bitmap) {
                scaledBitmap.recycle()
            }
            yPos += 170f
        }

        // Results header
        canvas = ensureSpace(50f)
        paint.apply {
            color = Color.BLACK
            textSize = 16f
            isFakeBoldText = true
        }
        canvas.drawText("Обнаруженные объекты:", 40f, yPos, paint)
        yPos += 30f

        // Draw divider
        paint.apply {
            color = Color.LTGRAY
            strokeWidth = 1f
        }
        canvas.drawLine(40f, yPos, 555f, yPos, paint)
        yPos += 20f

        // Column headers
        canvas = ensureSpace(40f)
        paint.apply {
            color = Color.DKGRAY
            textSize = 12f
            isFakeBoldText = true
        }
        canvas.drawText("№", 40f, yPos, paint)
        canvas.drawText("Объект", 70f, yPos, paint)
        canvas.drawText("Уверенность", 300f, yPos, paint)
        canvas.drawText("Стоимость", 450f, yPos, paint)
        yPos += 20f

        // Divider
        paint.color = Color.LTGRAY
        canvas.drawLine(40f, yPos, 555f, yPos, paint)
        yPos += 15f

        // Results list
        paint.isFakeBoldText = false
        paint.color = Color.BLACK
        var totalCost = 0f

        results.forEachIndexed { index, result ->
            canvas = ensureSpace(30f)
            paint.textSize = 13f
            paint.color = Color.BLACK
            canvas.drawText("${index + 1}.", 40f, yPos, paint)
            canvas.drawText(result.label.replaceFirstChar { it.uppercase() }, 70f, yPos, paint)
            canvas.drawText("${(result.confidence * 100).toInt()}%", 300f, yPos, paint)
            canvas.drawText(currencyFormat.format(result.estimatedCost), 450f, yPos, paint)

            totalCost += result.estimatedCost
            yPos += 25f
        }

        // Total section
        canvas = ensureSpace(70f)
        yPos += 20f
        paint.color = Color.LTGRAY
        canvas.drawLine(40f, yPos, 555f, yPos, paint)
        yPos += 25f

        paint.apply {
            color = Color.parseColor("#1E88E5")
            textSize = 18f
            isFakeBoldText = true
        }
        canvas.drawText("💰 Итого: ${currencyFormat.format(totalCost)}", 40f, yPos, paint)

        // Footer on last page
        paint.apply {
            color = Color.GRAY
            textSize = 10f
            isFakeBoldText = false
        }
        canvas.drawText(
            "Документ создан автоматически приложением Construction Estimator",
            40f, 800f, paint
        )
        canvas.drawText(
            "Данная смета является предварительной и требует уточнения специалистом",
            40f, 815f, paint
        )

        // Finish last page
        document.finishPage(document.pages.last())
    }

    private fun createPdfFile(context: Context): File {
        val fileName = "estimate_${System.currentTimeMillis()}.pdf"
        val documentsDir = context.getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS)
            ?: context.filesDir
        return File(documentsDir, fileName)
    }

    /**
     * Share PDF file via intent
     */
    fun share(context: Context, file: File) {
        try {
            val uri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                file
            )

            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                type = "application/pdf"
                putExtra(Intent.EXTRA_STREAM, uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }

            context.startActivity(Intent.createChooser(shareIntent, "Отправить смету"))
        } catch (e: Exception) {
            Toast.makeText(context, "❌ Ошибка отправки: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    /**
     * Open PDF file for viewing
     */
    fun open(context: Context, file: File) {
        try {
            val uri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                file
            )

            val viewIntent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, "application/pdf")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }

            context.startActivity(viewIntent)
        } catch (e: Exception) {
            Toast.makeText(
                context,
                "❌ Установите приложение для просмотра PDF",
                Toast.LENGTH_SHORT
            ).show()
        }
    }
}
