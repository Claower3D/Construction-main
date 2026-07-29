package com.example.constructionestimator

import android.content.Context
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.floatingactionbutton.FloatingActionButton
import org.json.JSONArray
import org.json.JSONObject
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.*

/**
 * Activity for displaying analysis history
 */
class HistoryActivity : AppCompatActivity() {

    private lateinit var historyList: RecyclerView
    private lateinit var emptyView: TextView
    private lateinit var adapter: HistoryAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_history)

        initViews()
        loadHistory()
    }

    private fun initViews() {
        historyList = findViewById(R.id.historyList)
        emptyView = findViewById(R.id.emptyView)

        historyList.layoutManager = LinearLayoutManager(this)
        adapter = HistoryAdapter(this) { item ->
            showDetailDialog(item)
        }
        historyList.adapter = adapter

        // Back button
        findViewById<View>(R.id.backButton)?.setOnClickListener {
            finish()
        }

        // Clear history button
        findViewById<FloatingActionButton>(R.id.clearHistoryButton)?.setOnClickListener {
            confirmClearHistory()
        }
    }

    private fun loadHistory() {
        val history = AnalysisHistory.getAll(this)
        if (history.isEmpty()) {
            historyList.visibility = View.GONE
            emptyView.visibility = View.VISIBLE
        } else {
            historyList.visibility = View.VISIBLE
            emptyView.visibility = View.GONE
            adapter.setItems(history)
        }
    }

    private fun showDetailDialog(item: AnalysisHistoryItem) {
        val message = buildString {
            append("📅 Дата: ${item.formattedDate}\n\n")
            append("🏗️ Обнаружено объектов: ${item.objectsCount}\n\n")
            item.detectedObjects.forEachIndexed { index, obj ->
                append("${index + 1}. ${obj.label}\n")
                append("   Уверенность: ${(obj.confidence * 100).toInt()}%\n")
                append("   Стоимость: ${formatCurrency(obj.cost)}\n\n")
            }
            append("💰 Итого: ${formatCurrency(item.totalCost)}")
        }

        AlertDialog.Builder(this)
            .setTitle("Результат анализа")
            .setMessage(message)
            .setPositiveButton("OK", null)
            .setNeutralButton("Удалить") { _, _ ->
                AnalysisHistory.delete(this, item.id)
                loadHistory()
            }
            .show()
    }

    private fun confirmClearHistory() {
        AlertDialog.Builder(this)
            .setTitle("Очистить историю?")
            .setMessage("Все записи будут удалены. Это действие нельзя отменить.")
            .setPositiveButton("Удалить") { _, _ ->
                AnalysisHistory.clearAll(this)
                loadHistory()
                Toast.makeText(this, "История очищена", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Отмена", null)
            .show()
    }

    private fun formatCurrency(amount: Float): String {
        return NumberFormat.getCurrencyInstance(Locale("ru", "RU")).format(amount)
    }
}

/**
 * Data class for history item
 */
data class AnalysisHistoryItem(
    val id: String,
    val timestamp: Long,
    val objectsCount: Int,
    val totalCost: Float,
    val detectedObjects: List<DetectedObject>
) {
    val formattedDate: String
        get() = SimpleDateFormat("dd.MM.yyyy HH:mm", Locale.getDefault())
            .format(Date(timestamp))

    data class DetectedObject(
        val label: String,
        val confidence: Float,
        val cost: Float
    )
}

/**
 * RecyclerView Adapter for history list
 */
class HistoryAdapter(
    private val context: Context,
    private val onClick: (AnalysisHistoryItem) -> Unit
) : RecyclerView.Adapter<HistoryAdapter.ViewHolder>() {

    private val items = mutableListOf<AnalysisHistoryItem>()
    private val currencyFormat = NumberFormat.getCurrencyInstance(Locale("ru", "RU"))

    fun setItems(newItems: List<AnalysisHistoryItem>) {
        items.clear()
        items.addAll(newItems)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_history, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val item = items[position]
        holder.bind(item)
    }

    override fun getItemCount() = items.size

    inner class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val dateText: TextView = itemView.findViewById(R.id.dateText)
        private val objectsText: TextView = itemView.findViewById(R.id.objectsText)
        private val costText: TextView = itemView.findViewById(R.id.costText)

        fun bind(item: AnalysisHistoryItem) {
            dateText.text = item.formattedDate
            objectsText.text = "Объектов: ${item.objectsCount}"
            costText.text = currencyFormat.format(item.totalCost)

            itemView.setOnClickListener { onClick(item) }
        }
    }
}

/**
 * Helper object for managing analysis history in SharedPreferences
 */
object AnalysisHistory {
    private const val PREFS_NAME = "analysis_history"
    private const val KEY_HISTORY = "history_items"

    fun save(context: Context, results: List<ObjectDetector.DetectionResult>) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val historyJson = prefs.getString(KEY_HISTORY, "[]") ?: "[]"
        val array = JSONArray(historyJson)

        // Create new entry
        val entry = JSONObject().apply {
            put("id", UUID.randomUUID().toString())
            put("timestamp", System.currentTimeMillis())
            put("objectsCount", results.size)
            put("totalCost", results.sumOf { it.estimatedCost.toDouble() })

            val objectsArray = JSONArray()
            results.forEach { result ->
                val obj = JSONObject().apply {
                    put("label", result.label)
                    put("confidence", result.confidence)
                    put("cost", result.estimatedCost)
                }
                objectsArray.put(obj)
            }
            put("objects", objectsArray)
        }

        array.put(entry)

        // Keep only last 50 entries
        while (array.length() > 50) {
            array.remove(0)
        }

        prefs.edit().putString(KEY_HISTORY, array.toString()).apply()
    }

    fun getAll(context: Context): List<AnalysisHistoryItem> {
        return try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val historyJson = prefs.getString(KEY_HISTORY, "[]") ?: "[]"
            val array = JSONArray(historyJson)

            val items = mutableListOf<AnalysisHistoryItem>()
            for (i in array.length() - 1 downTo 0) {
                try {
                    val obj = array.getJSONObject(i)
                    val objectsArray = obj.getJSONArray("objects")

                    val detectedObjects = mutableListOf<AnalysisHistoryItem.DetectedObject>()
                    for (j in 0 until objectsArray.length()) {
                        val detObj = objectsArray.getJSONObject(j)
                        detectedObjects.add(
                            AnalysisHistoryItem.DetectedObject(
                                label = detObj.getString("label"),
                                confidence = detObj.getDouble("confidence").toFloat(),
                                cost = detObj.getDouble("cost").toFloat()
                            )
                        )
                    }

                    items.add(
                        AnalysisHistoryItem(
                            id = obj.getString("id"),
                            timestamp = obj.getLong("timestamp"),
                            objectsCount = obj.getInt("objectsCount"),
                            totalCost = obj.getDouble("totalCost").toFloat(),
                            detectedObjects = detectedObjects
                        )
                    )
                } catch (e: Exception) {
                    // Skip corrupted individual entry
                    e.printStackTrace()
                }
            }

            items
        } catch (e: Exception) {
            // If entire history JSON is corrupted, return empty list
            e.printStackTrace()
            emptyList()
        }
    }

    fun delete(context: Context, id: String) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val historyJson = prefs.getString(KEY_HISTORY, "[]") ?: "[]"
        val array = JSONArray(historyJson)

        val newArray = JSONArray()
        for (i in 0 until array.length()) {
            val obj = array.getJSONObject(i)
            if (obj.getString("id") != id) {
                newArray.put(obj)
            }
        }

        prefs.edit().putString(KEY_HISTORY, newArray.toString()).apply()
    }

    fun clearAll(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(KEY_HISTORY, "[]").apply()
    }
}
