package com.hindiassist

import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.view.inputmethod.InputMethodManager
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.hindiassist.privacy.PrivacyActivity
import com.hindiassist.settings.SettingsActivity
import com.hindiassist.translation.TranslationManager
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private val translationManager = TranslationManager()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val rootLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 48, 48, 48)
        }

        val title = TextView(this).apply {
            text = "HINDI ASSIST"
            textSize = 28f
            setPadding(0, 0, 0, 8)
        }
        val subtitle = TextView(this).apply {
            text = "Understand every message. Reply naturally.\nEnglish • Hindi • Telugu"
            textSize = 15f
            setPadding(0, 0, 0, 32)
        }
        rootLayout.addView(title)
        rootLayout.addView(subtitle)

        // Button: Enable Keyboard
        val btnEnableKeyboard = Button(this).apply {
            text = "1. Enable Hindi Assist Keyboard in Settings"
            setOnClickListener {
                startActivity(Intent(Settings.ACTION_INPUT_METHOD_SETTINGS))
            }
        }
        rootLayout.addView(btnEnableKeyboard)

        // Button: Select Keyboard
        val btnSelectKeyboard = Button(this).apply {
            text = "2. Select Hindi Assist Keyboard"
            setOnClickListener {
                val imm = getSystemService(INPUT_METHOD_SERVICE) as? InputMethodManager
                imm?.showInputMethodPicker()
            }
        }
        rootLayout.addView(btnSelectKeyboard)

        // Live test translation area
        val testLabel = TextView(this).apply {
            text = "\nOn-Device Translation Test:"
            textSize = 16f
            setPadding(0, 16, 0, 8)
        }
        rootLayout.addView(testLabel)

        val inputField = EditText(this).apply {
            hint = "Type English or Hindi here..."
            setText("Are you free now?")
        }
        rootLayout.addView(inputField)

        val resultView = TextView(this).apply {
            text = "Result will appear here"
            textSize = 16f
            setPadding(0, 16, 0, 16)
        }

        val btnTestTranslate = Button(this).apply {
            text = "Translate (📱 On-device)"
            setOnClickListener {
                lifecycleScope.launch {
                    val res = translationManager.translate(
                        text = inputField.text.toString(),
                        requestedSourceLang = "auto",
                        targetLang = "hi"
                    )
                    resultView.text = "${res.processingSource}: ${res.translatedText}"
                }
            }
        }
        rootLayout.addView(btnTestTranslate)
        rootLayout.addView(resultView)

        // Navigation to Privacy & Settings
        val btnPrivacy = Button(this).apply {
            text = "🛡️ Privacy Center"
            setOnClickListener {
                startActivity(Intent(this@MainActivity, PrivacyActivity::class.java))
            }
        }
        val btnSettings = Button(this).apply {
            text = "⚙️ Settings"
            setOnClickListener {
                startActivity(Intent(this@MainActivity, SettingsActivity::class.java))
            }
        }
        rootLayout.addView(btnPrivacy)
        rootLayout.addView(btnSettings)

        setContentView(rootLayout)
    }
}
