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
 * Request Details Activity
 * Детали заявки на инженерные решения
 */
class RequestDetailsActivity : AppCompatActivity() {

    private var requestId: String = ""
    private var request: EngineerRequest? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_request_details)

        requestId = intent.getStringExtra("request_id") ?: ""
        loadRequest()
        initViews()
    }

    private fun loadRequest() {
        // Find request by ID from demo data
        request = EngineerDataManager.getAvailableRequests(this).find { it.id == requestId }
    }

    private fun initViews() {
        val req = request ?: return finish()

        // Back button
        findViewById<View>(R.id.backButton).setOnClickListener { finish() }

        // Header
        findViewById<TextView>(R.id.requestTitle).text = req.objectName
        findViewById<TextView>(R.id.requestCategory).text = getCategoryLabel(req.category)
        findViewById<TextView>(R.id.requestPrice).text = formatPrice(req.totalPrice)
        findViewById<TextView>(R.id.requestStatus).text = getStatusLabel(req.status)

        // Object info
        findViewById<TextView>(R.id.objectAddress).text = "📍 ${req.objectAddress}"
        findViewById<TextView>(R.id.objectRequirements).text = req.requirements

        // Customer info
        findViewById<TextView>(R.id.customerName).text = "👤 ${req.customerName}"
        findViewById<TextView>(R.id.customerPhone).text = "📱 ${req.customerPhone}"
        findViewById<TextView>(R.id.customerEmail).text = "📧 ${req.customerEmail}"

        // Deadline
        if (req.deadline != null) {
            findViewById<TextView>(R.id.deadline).text = "📅 Срок: ${formatDate(req.deadline)}"
        }

        // Solutions
        val solutionsContainer = findViewById<LinearLayout>(R.id.solutionsContainer)
        req.solutions.forEach { solution ->
            val solutionView = layoutInflater.inflate(R.layout.item_solution, solutionsContainer, false)
            solutionView.findViewById<TextView>(R.id.solutionIcon).text = solution.icon
            solutionView.findViewById<TextView>(R.id.solutionName).text = solution.name
            solutionView.findViewById<TextView>(R.id.solutionDesc).text = solution.description
            solutionView.findViewById<TextView>(R.id.solutionPrice).text = formatPrice(solution.price)
            solutionsContainer.addView(solutionView)
        }

        // Attachments
        if (req.attachments.isNotEmpty()) {
            val attachmentsContainer = findViewById<LinearLayout>(R.id.attachmentsContainer)
            req.attachments.forEach { att ->
                val attView = TextView(this).apply {
                    text = "📎 ${att.name}"
                    textSize = 14f
                    setTextColor(resources.getColor(R.color.info, theme))
                    setPadding(0, 8, 0, 8)
                    setOnClickListener {
                        Toast.makeText(this@RequestDetailsActivity, "Скачивание ${att.name}...", Toast.LENGTH_SHORT).show()
                    }
                }
                attachmentsContainer.addView(attView)
            }
        }

        // Action buttons
        findViewById<Button>(R.id.contactButton).setOnClickListener { contactCustomer() }
        findViewById<Button>(R.id.takeButton).setOnClickListener { takeRequest() }
    }

    private fun contactCustomer() {
        val req = request ?: return
        AlertDialog.Builder(this)
            .setTitle("Связаться с заказчиком")
            .setItems(arrayOf("📞 Позвонить", "📧 Написать email")) { _, which ->
                when (which) {
                    0 -> {
                        val intent = Intent(Intent.ACTION_DIAL).apply {
                            data = Uri.parse("tel:${req.customerPhone}")
                        }
                        startActivity(intent)
                    }
                    1 -> {
                        val intent = Intent(Intent.ACTION_SENDTO).apply {
                            data = Uri.parse("mailto:${req.customerEmail}")
                        }
                        startActivity(intent)
                    }
                }
            }
            .show()
    }

    private fun takeRequest() {
        val req = request ?: return
        AlertDialog.Builder(this)
            .setTitle("Откликнуться на заявку?")
            .setMessage("Вы хотите взять заявку \"${req.objectName}\"?")
            .setPositiveButton("Да") { _, _ ->
                EngineerDataManager.acceptRequest(this, req.id)
                Toast.makeText(this, "✅ Заявка принята!", Toast.LENGTH_SHORT).show()
                finish()
            }
            .setNegativeButton("Отмена", null)
            .show()
    }

    private fun getCategoryLabel(category: String): String {
        return when (category) {
            "DESIGN" -> "🎨 Дизайн-проект"
            "DOCUMENTATION" -> "📄 Документация"
            "CALCULATION" -> "🔢 Расчёты"
            else -> category
        }
    }

    private fun getStatusLabel(status: String): String {
        return when (status) {
            "PENDING" -> "⏳ Ожидает"
            "IN_WORK" -> "🔧 В работе"
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
