package com.hindiassist.privacy

import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.hindiassist.history.HistoryDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class PrivacyActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val rootLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 48, 48, 48)
        }

        val title = TextView(this).apply {
            text = "Privacy Center"
            textSize = 24f
            setPadding(0, 0, 0, 24)
        }
        rootLayout.addView(title)

        val privacySummary = TextView(this).apply {
            text = """
                🔒 Hindi Assist Privacy Guarantees:

                • Translation Engine: 📱 On-device by default
                • WhatsApp Integration: 0% scraping, 0% background snooping
                • Keyboard Input: Never logged, never transmitted
                • Sensitive Inputs: Passwords and OTPs completely ignored
                • Clipboard Access: Explicit user tap only
                • Cloud AI: OFF by default (Requires explicit consent)
                • Translation History: Stored strictly on local device
            """.trimIndent()
            textSize = 15f
            setLineSpacing(8f, 1.2f)
            setPadding(0, 0, 0, 32)
        }
        rootLayout.addView(privacySummary)

        val btnClearHistory = Button(this).apply {
            text = "Clear All Local History"
            setOnClickListener {
                CoroutineScope(Dispatchers.IO).launch {
                    HistoryDatabase.getInstance(this@PrivacyActivity).historyDao().deleteAll()
                    runOnUiThread {
                        Toast.makeText(this@PrivacyActivity, "Local history wiped cleanly.", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }
        rootLayout.addView(btnClearHistory)

        setContentView(rootLayout)
    }
}
