package com.example.constructionestimator

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.*
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.*

/**
 * Project Details Activity
 * Детали проекта инженера
 */
class ProjectDetailsActivity : AppCompatActivity() {

    private var projectId: String = ""
    private var project: EngineerProject? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_project_details)

        projectId = intent.getStringExtra("project_id") ?: ""
        loadProject()
        initViews()
    }

    private fun loadProject() {
        project = EngineerDataManager.getMyProjects(this).find { it.id == projectId }
    }

    private fun initViews() {
        val proj = project ?: return finish()

        // Back button
        findViewById<View>(R.id.backButton).setOnClickListener { finish() }

        // Header
        findViewById<TextView>(R.id.projectTitle).text = proj.objectName
        findViewById<TextView>(R.id.projectStatus).text = getStatusLabel(proj.status)
        findViewById<TextView>(R.id.projectPrice).text = formatPrice(proj.totalPrice)

        // Progress
        findViewById<ProgressBar>(R.id.progressBar).progress = proj.progress
        findViewById<TextView>(R.id.progressText).text = "${proj.progress}%"

        // Object info
        findViewById<TextView>(R.id.objectAddress).text = "📍 ${proj.objectAddress}"

        // Customer info
        findViewById<TextView>(R.id.customerName).text = "👤 ${proj.customerName}"
        findViewById<TextView>(R.id.customerPhone).text = "📱 ${proj.customerPhone}"
        findViewById<TextView>(R.id.customerEmail).text = "📧 ${proj.customerEmail}"

        // Timeline
        val timelineContainer = findViewById<LinearLayout>(R.id.timelineContainer)
        addTimelineItem(timelineContainer, "📝 Создано", proj.createdAt)
        proj.assignedAt?.let { addTimelineItem(timelineContainer, "🔧 Взято в работу", it) }
        proj.submittedAt?.let { addTimelineItem(timelineContainer, "📤 Отправлено на проверку", it) }

        // Files
        setupFiles(proj)

        // Comments
        setupComments(proj)

        // Action buttons
        findViewById<Button>(R.id.contactButton).setOnClickListener { contactCustomer() }
        
        val submitButton = findViewById<Button>(R.id.submitButton)
        if (proj.status == "IN_WORK") {
            submitButton.visibility = android.view.View.VISIBLE
            submitButton.setOnClickListener { submitProject() }
        } else {
            submitButton.visibility = android.view.View.GONE
        }
    }

    private fun addTimelineItem(container: LinearLayout, label: String, date: Date) {
        val view = TextView(this).apply {
            text = "$label — ${formatDate(date)}"
            textSize = 14f
            setTextColor(resources.getColor(R.color.text_muted, theme))
            setPadding(0, 8, 0, 8)
        }
        container.addView(view)
    }

    private fun setupFiles(proj: EngineerProject) {
        val filesContainer = findViewById<LinearLayout>(R.id.filesContainer)
        
        if (proj.files.isEmpty()) {
            val emptyText = TextView(this).apply {
                text = "Нет файлов"
                textSize = 14f
                setTextColor(resources.getColor(R.color.text_muted, theme))
            }
            filesContainer.addView(emptyText)
        } else {
            proj.files.forEach { file ->
                val fileView = layoutInflater.inflate(R.layout.item_file, filesContainer, false)
                fileView.findViewById<TextView>(R.id.fileIcon).text = getFileIcon(file.type)
                fileView.findViewById<TextView>(R.id.fileName).text = file.name
                fileView.findViewById<TextView>(R.id.fileSize).text = file.size
                fileView.setOnClickListener {
                    Toast.makeText(this, "Скачивание ${file.name}...", Toast.LENGTH_SHORT).show()
                }
                filesContainer.addView(fileView)
            }
        }

        // Upload button
        findViewById<Button>(R.id.uploadButton).setOnClickListener {
            Toast.makeText(this, "Выбор файлов...", Toast.LENGTH_SHORT).show()
        }
    }

    private fun setupComments(proj: EngineerProject) {
        val commentsContainer = findViewById<LinearLayout>(R.id.commentsContainer)
        
        if (proj.comments.isEmpty()) {
            val emptyText = TextView(this).apply {
                text = "Нет комментариев"
                textSize = 14f
                setTextColor(resources.getColor(R.color.text_muted, theme))
            }
            commentsContainer.addView(emptyText)
        } else {
            proj.comments.forEach { comment ->
                val commentView = layoutInflater.inflate(R.layout.item_comment, commentsContainer, false)
                commentView.findViewById<TextView>(R.id.commentAuthor).text = comment.author
                commentView.findViewById<TextView>(R.id.commentText).text = comment.text
                commentView.findViewById<TextView>(R.id.commentDate).text = formatDate(comment.createdAt)
                commentsContainer.addView(commentView)
            }
        }

        // Add comment
        findViewById<Button>(R.id.addCommentButton).setOnClickListener {
            val commentInput = findViewById<EditText>(R.id.commentInput)
            val text = commentInput.text.toString().trim()
            if (text.isNotEmpty()) {
                Toast.makeText(this, "✅ Комментарий добавлен", Toast.LENGTH_SHORT).show()
                commentInput.text.clear()
            }
        }
    }

    private fun getFileIcon(type: String): String {
        return when (type.lowercase()) {
            "pdf" -> "📄"
            "dwg", "dxf" -> "📐"
            "doc", "docx" -> "📝"
            "xls", "xlsx", "excel" -> "📊"
            "jpg", "png", "jpeg" -> "🖼️"
            "zip", "rar" -> "📦"
            else -> "📁"
        }
    }

    private fun contactCustomer() {
        val proj = project ?: return
        AlertDialog.Builder(this)
            .setTitle("Связаться с заказчиком")
            .setItems(arrayOf("📞 Позвонить", "📧 Написать email")) { _, which ->
                when (which) {
                    0 -> {
                        val intent = Intent(Intent.ACTION_DIAL).apply {
                            data = Uri.parse("tel:${proj.customerPhone}")
                        }
                        startActivity(intent)
                    }
                    1 -> {
                        val intent = Intent(Intent.ACTION_SENDTO).apply {
                            data = Uri.parse("mailto:${proj.customerEmail}")
                        }
                        startActivity(intent)
                    }
                }
            }
            .show()
    }

    private fun submitProject() {
        val proj = project ?: return
        AlertDialog.Builder(this)
            .setTitle("Сдать работу?")
            .setMessage("Вы уверены, что хотите сдать проект на проверку?")
            .setPositiveButton("Сдать") { _, _ ->
                EngineerDataManager.submitProject(this, proj.id)
                Toast.makeText(this, "📤 Работа отправлена на проверку!", Toast.LENGTH_SHORT).show()
                finish()
            }
            .setNegativeButton("Отмена", null)
            .show()
    }

    private fun getStatusLabel(status: String): String {
        return when (status) {
            "IN_WORK" -> "🔧 В работе"
            "ON_REVIEW" -> "👁️ На проверке"
            "REVISION" -> "🔄 На доработке"
            "CLOSED" -> "✅ Завершён"
            else -> status
        }
    }

    private fun formatPrice(price: Long): String {
        val format = NumberFormat.getInstance(Locale("ru", "RU"))
        return format.format(price) + " ₸"
    }

    private fun formatDate(date: Date): String {
        return SimpleDateFormat("dd.MM.yyyy", Locale.getDefault()).format(date)
    }
}
