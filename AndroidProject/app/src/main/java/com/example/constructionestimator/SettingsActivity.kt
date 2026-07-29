package com.example.constructionestimator

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Button
import android.widget.Switch
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import java.text.NumberFormat
import java.util.*

/**
 * Settings Activity
 */
class SettingsActivity : AppCompatActivity() {

    private lateinit var priceMultiplierText: TextView
    private lateinit var languageText: TextView
    private lateinit var soundSwitch: Switch
    private lateinit var vibrationSwitch: Switch

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)

        initViews()
        loadSettings()
    }

    private fun initViews() {
        priceMultiplierText = findViewById(R.id.priceMultiplierText)
        languageText = findViewById(R.id.languageText)
        soundSwitch = findViewById(R.id.soundSwitch)
        vibrationSwitch = findViewById(R.id.vibrationSwitch)

        // Back button
        findViewById<android.view.View>(R.id.backButton).setOnClickListener {
            finish()
        }

        // Price multiplier
        findViewById<android.view.View>(R.id.priceMultiplierRow).setOnClickListener {
            showPriceMultiplierDialog()
        }

        // Language
        findViewById<android.view.View>(R.id.languageRow).setOnClickListener {
            showLanguageDialog()
        }

        // Sound switch
        soundSwitch.setOnCheckedChangeListener { _, isChecked ->
            AppSettings.setSoundEnabled(this, isChecked)
        }

        // Vibration switch
        vibrationSwitch.setOnCheckedChangeListener { _, isChecked ->
            AppSettings.setVibrationEnabled(this, isChecked)
        }

        // Clear cache
        findViewById<Button>(R.id.clearCacheButton).setOnClickListener {
            clearCache()
        }

        // About
        findViewById<android.view.View>(R.id.aboutRow).setOnClickListener {
            showAboutDialog()
        }

        // Rate app
        findViewById<Button>(R.id.rateButton).setOnClickListener {
            rateApp()
        }
    }

    private fun loadSettings() {
        val multiplier = AppSettings.getPriceMultiplier(this)
        priceMultiplierText.text = "${(multiplier * 100).toInt()}%"

        val lang = AppSettings.getLanguage(this)
        languageText.text = when (lang) {
            "ru" -> "Русский"
            "kz" -> "Қазақша"
            "en" -> "English"
            else -> "Русский"
        }

        soundSwitch.isChecked = AppSettings.isSoundEnabled(this)
        vibrationSwitch.isChecked = AppSettings.isVibrationEnabled(this)
    }

    private fun showPriceMultiplierDialog() {
        val options = arrayOf("50%", "75%", "100%", "125%", "150%", "200%")
        val values = floatArrayOf(0.5f, 0.75f, 1.0f, 1.25f, 1.5f, 2.0f)
        val current = AppSettings.getPriceMultiplier(this)
        val selected = values.indexOfFirst { it == current }.coerceAtLeast(0)

        AlertDialog.Builder(this)
            .setTitle("Коэффициент цен")
            .setSingleChoiceItems(options, selected) { dialog, which ->
                AppSettings.setPriceMultiplier(this, values[which])
                priceMultiplierText.text = options[which]
                dialog.dismiss()
            }
            .setNegativeButton("Отмена", null)
            .show()
    }

    private fun showLanguageDialog() {
        val options = arrayOf("Русский", "Қазақша", "English")
        val values = arrayOf("ru", "kz", "en")
        val current = AppSettings.getLanguage(this)
        val selected = values.indexOfFirst { it == current }.coerceAtLeast(0)

        AlertDialog.Builder(this)
            .setTitle("Язык")
            .setSingleChoiceItems(options, selected) { dialog, which ->
                AppSettings.setLanguage(this, values[which])
                languageText.text = options[which]
                dialog.dismiss()
                Toast.makeText(this, "Перезапустите приложение для применения", Toast.LENGTH_LONG).show()
            }
            .setNegativeButton("Отмена", null)
            .show()
    }

    private fun clearCache() {
        AlertDialog.Builder(this)
            .setTitle("Очистить кэш?")
            .setMessage("Временные файлы и фотографии будут удалены.")
            .setPositiveButton("Очистить") { _, _ ->
                cacheDir.deleteRecursively()
                Toast.makeText(this, "Кэш очищен", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Отмена", null)
            .show()
    }

    private fun showAboutDialog() {
        val message = """
            Construction Estimator v1.0
            
            🏗️ AI-приложение для оценки строительных работ
            
            • Распознавание объектов на фото
            • Автоматический расчёт стоимости
            • Генерация PDF отчётов
            
            © 2024 QazGost AI
        """.trimIndent()

        AlertDialog.Builder(this)
            .setTitle("О приложении")
            .setMessage(message)
            .setPositiveButton("OK", null)
            .show()
    }

    private fun rateApp() {
        try {
            val intent = Intent(Intent.ACTION_VIEW).apply {
                data = Uri.parse("market://details?id=$packageName")
            }
            startActivity(intent)
        } catch (e: Exception) {
            Toast.makeText(this, "Play Store недоступен", Toast.LENGTH_SHORT).show()
        }
    }
}

/**
 * Settings storage helper
 */
object AppSettings {
    private const val PREFS_NAME = "app_settings"
    private const val KEY_PRICE_MULTIPLIER = "price_multiplier"
    private const val KEY_LANGUAGE = "language"
    private const val KEY_SOUND = "sound_enabled"
    private const val KEY_VIBRATION = "vibration_enabled"

    fun getPriceMultiplier(context: Context): Float {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getFloat(KEY_PRICE_MULTIPLIER, 1.0f)
    }

    fun setPriceMultiplier(context: Context, value: Float) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit().putFloat(KEY_PRICE_MULTIPLIER, value).apply()
    }

    fun getLanguage(context: Context): String {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getString(KEY_LANGUAGE, "ru") ?: "ru"
    }

    fun setLanguage(context: Context, lang: String) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit().putString(KEY_LANGUAGE, lang).apply()
    }

    fun isSoundEnabled(context: Context): Boolean {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getBoolean(KEY_SOUND, true)
    }

    fun setSoundEnabled(context: Context, enabled: Boolean) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit().putBoolean(KEY_SOUND, enabled).apply()
    }

    fun isVibrationEnabled(context: Context): Boolean {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getBoolean(KEY_VIBRATION, true)
    }

    fun setVibrationEnabled(context: Context, enabled: Boolean) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit().putBoolean(KEY_VIBRATION, enabled).apply()
    }
}
