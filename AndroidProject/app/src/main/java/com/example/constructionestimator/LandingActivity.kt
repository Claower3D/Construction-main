package com.example.constructionestimator

import android.content.Intent
import android.os.Bundle
import android.view.animation.AnimationUtils
import android.widget.Button
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class LandingActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_landing)

        initViews()
        startAnimations()
    }

    private fun initViews() {
        val logoImage = findViewById<ImageView>(R.id.logoImage)
        val titleText = findViewById<TextView>(R.id.titleText)
        val subtitleText = findViewById<TextView>(R.id.subtitleText)
        val startButton = findViewById<Button>(R.id.startButton)
        
        // Start camera activity
        startButton.setOnClickListener {
            val intent = Intent(this, MainActivity::class.java)
            startActivity(intent)
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        }
        
        // History button (optional)
        findViewById<Button?>(R.id.historyButton)?.setOnClickListener {
            val intent = Intent(this, HistoryActivity::class.java)
            startActivity(intent)
        }
        
        // Settings button (optional)
        findViewById<ImageButton?>(R.id.settingsButton)?.setOnClickListener {
            val intent = Intent(this, SettingsActivity::class.java)
            startActivity(intent)
        }
        
        // Engineer cabinet button
        findViewById<Button?>(R.id.engineerButton)?.setOnClickListener {
            val intent = Intent(this, EngineerActivity::class.java)
            startActivity(intent)
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        }
    }

    private fun startAnimations() {
        val fadeIn = AnimationUtils.loadAnimation(this, android.R.anim.fade_in).apply {
            duration = 1000
        }
        
        val slideUp = AnimationUtils.loadAnimation(this, android.R.anim.slide_in_left).apply {
            duration = 800
        }

        findViewById<ImageView>(R.id.logoImage).startAnimation(fadeIn)
        findViewById<TextView>(R.id.titleText).startAnimation(slideUp)
        findViewById<TextView>(R.id.subtitleText).startAnimation(fadeIn)
        
        findViewById<Button>(R.id.startButton).postDelayed({
            findViewById<Button>(R.id.startButton).startAnimation(fadeIn)
        }, 500)
    }
}
