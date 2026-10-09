package com.hindiassist.settings

import android.os.Bundle
import android.widget.LinearLayout
import android.widget.Switch
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch

class SettingsActivity : AppCompatActivity() {

    private lateinit var settingsRepo: SettingsRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        settingsRepo = SettingsRepository(this)

        val rootLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 48, 48, 48)
        }

        val title = TextView(this).apply {
            text = "Hindi Assist Settings"
            textSize = 22f
            setPadding(0, 0, 0, 32)
        }
        rootLayout.addView(title)

        // History Toggle (Default OFF)
        val historySwitch = Switch(this).apply {
            text = "Enable Local Translation History (Default: OFF)"
            setPadding(0, 16, 0, 16)
        }
        rootLayout.addView(historySwitch)

        // Cloud AI Toggle (Default OFF)
        val cloudAiSwitch = Switch(this).apply {
            text = "Enable Cloud AI Translation (Default: OFF, Privacy Warning)"
            setPadding(0, 16, 0, 16)
        }
        rootLayout.addView(cloudAiSwitch)

        // History Protection Toggle
        val protectionSwitch = Switch(this).apply {
            text = "Biometric / Device Lock for History"
            setPadding(0, 16, 0, 16)
        }
        rootLayout.addView(protectionSwitch)

        // Model Status Text
        val modelInfo = TextView(this).apply {
            text = "\nOn-Device Models:\n• English: Ready\n• Hindi: ML Kit On-Device\n• Telugu: ML Kit On-Device"
            textSize = 14f
            setPadding(0, 24, 0, 24)
        }
        rootLayout.addView(modelInfo)

        lifecycleScope.launch {
            settingsRepo.isHistoryEnabled.collect { historySwitch.isChecked = it }
        }
        lifecycleScope.launch {
            settingsRepo.isCloudAiEnabled.collect { cloudAiSwitch.isChecked = it }
        }
        lifecycleScope.launch {
            settingsRepo.isHistoryProtectionEnabled.collect { protectionSwitch.isChecked = it }
        }

        historySwitch.setOnCheckedChangeListener { _, isChecked ->
            lifecycleScope.launch { settingsRepo.setHistoryEnabled(isChecked) }
        }

        cloudAiSwitch.setOnCheckedChangeListener { _, isChecked ->
            lifecycleScope.launch { settingsRepo.setCloudAiEnabled(isChecked) }
        }

        protectionSwitch.setOnCheckedChangeListener { _, isChecked ->
            lifecycleScope.launch { settingsRepo.setHistoryProtectionEnabled(isChecked) }
        }

        setContentView(rootLayout)
    }
}
