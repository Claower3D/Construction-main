package com.example.constructionestimator

import android.os.Bundle
import android.widget.*
import androidx.appcompat.app.AppCompatActivity

/**
 * Engineer Profile Editor Activity
 * Редактор профиля инженера
 */
class EngineerProfileEditorActivity : AppCompatActivity() {

    private lateinit var nameInput: EditText
    private lateinit var phoneInput: EditText
    private lateinit var emailInput: EditText
    private lateinit var cityInput: EditText
    private lateinit var experienceInput: EditText
    private lateinit var rateInput: EditText
    private lateinit var isCompanySwitch: Switch
    private lateinit var companyInput: EditText
    private lateinit var descriptionInput: EditText

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_engineer_profile_editor)

        initViews()
        loadProfile()
    }

    private fun initViews() {
        // Back button
        findViewById<android.view.View>(R.id.backButton).setOnClickListener {
            finish()
        }

        // Inputs
        nameInput = findViewById(R.id.nameInput)
        phoneInput = findViewById(R.id.phoneInput)
        emailInput = findViewById(R.id.emailInput)
        cityInput = findViewById(R.id.cityInput)
        experienceInput = findViewById(R.id.experienceInput)
        rateInput = findViewById(R.id.rateInput)
        isCompanySwitch = findViewById(R.id.isCompanySwitch)
        companyInput = findViewById(R.id.companyInput)
        descriptionInput = findViewById(R.id.descriptionInput)

        // Company switch
        isCompanySwitch.setOnCheckedChangeListener { _, isChecked ->
            companyInput.visibility = if (isChecked) android.view.View.VISIBLE else android.view.View.GONE
        }

        // Save button
        findViewById<Button>(R.id.saveButton).setOnClickListener {
            saveProfile()
        }
    }

    private fun loadProfile() {
        val profile = EngineerDataManager.getProfile(this)
        
        nameInput.setText(profile.fullName)
        phoneInput.setText(profile.phone)
        emailInput.setText(profile.email)
        cityInput.setText(profile.city)
        experienceInput.setText(if (profile.experience > 0) profile.experience.toString() else "")
        rateInput.setText(if (profile.hourlyRate > 0) profile.hourlyRate.toString() else "")
        isCompanySwitch.isChecked = profile.isCompany
        companyInput.setText(profile.companyName)
        companyInput.visibility = if (profile.isCompany) android.view.View.VISIBLE else android.view.View.GONE
        descriptionInput.setText(profile.description)

        // Load specializations checkboxes
        val specsContainer = findViewById<LinearLayout>(R.id.specializationsContainer)
        val allSpecs = EngineerDataManager.getAllSpecializations()
        
        allSpecs.forEach { spec ->
            val checkbox = CheckBox(this).apply {
                text = "${spec.icon} ${spec.name}"
                textSize = 14f
                setTextColor(resources.getColor(R.color.text, theme))
                isChecked = profile.specializations.contains(spec.id)
                tag = spec.id
            }
            specsContainer.addView(checkbox)
        }
    }

    private fun saveProfile() {
        // Collect selected specializations
        val specsContainer = findViewById<LinearLayout>(R.id.specializationsContainer)
        val selectedSpecs = mutableListOf<String>()
        for (i in 0 until specsContainer.childCount) {
            val child = specsContainer.getChildAt(i)
            if (child is CheckBox && child.isChecked) {
                selectedSpecs.add(child.tag as String)
            }
        }

        val profile = EngineerProfile(
            id = "user_${System.currentTimeMillis()}",
            fullName = nameInput.text.toString().trim(),
            phone = phoneInput.text.toString().trim(),
            email = emailInput.text.toString().trim(),
            city = cityInput.text.toString().trim(),
            isCompany = isCompanySwitch.isChecked,
            companyName = companyInput.text.toString().trim(),
            specializations = selectedSpecs,
            experience = experienceInput.text.toString().toIntOrNull() ?: 0,
            hourlyRate = rateInput.text.toString().toIntOrNull() ?: 0,
            description = descriptionInput.text.toString().trim()
        )

        EngineerDataManager.saveProfile(this, profile)
        
        Toast.makeText(this, "✅ Профиль сохранён", Toast.LENGTH_SHORT).show()
        setResult(RESULT_OK)
        finish()
    }
}
