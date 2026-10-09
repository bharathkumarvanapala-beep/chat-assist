package com.hindiassist.keyboard

import android.content.Context
import android.graphics.Typeface
import android.util.AttributeSet
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.HorizontalScrollView
import android.widget.LinearLayout
import android.widget.TextView
import com.hindiassist.theme.ColorTheme
import com.hindiassist.theme.ThemeManager

class KeyboardView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : LinearLayout(context, attrs, defStyleAttr) {

    interface KeyboardActionListener {
        fun onDirectionSelected(source: String, target: String, isAuto: Boolean)
        fun onClipboardTranslateRequested()
        fun onTranslateCurrentTextRequested()
        fun onInsertRequested()
        fun onCopyRequested()
        fun onThemeCycleRequested()
        fun onSwitchToSystemKeyboardRequested()
        fun onKeyPress(text: String)
        fun onBackspacePress()
        fun onEnterPress()
        fun onSpacePress()
    }

    var actionListener: KeyboardActionListener? = null

    private lateinit var toolbarScroll: HorizontalScrollView
    private lateinit var toolbarLayout: LinearLayout
    private lateinit var assistantCard: LinearLayout
    private lateinit var previewText: TextView
    private lateinit var statusBadgeText: TextView
    private lateinit var btnInsert: Button
    private lateinit var btnCopy: Button
    private lateinit var keypadLayout: LinearLayout

    private var currentTheme = ColorTheme.DAY

    init {
        orientation = VERTICAL
        initUi()
        applyTheme(currentTheme)
    }

    private fun initUi() {
        val dp = { value: Int ->
            TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, value.toFloat(), resources.displayMetrics).toInt()
        }

        // 1. Toolbar ScrollView
        toolbarScroll = HorizontalScrollView(context).apply {
            isHorizontalScrollBarEnabled = false
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
        }

        toolbarLayout = LinearLayout(context).apply {
            orientation = HORIZONTAL
            setPadding(dp(4), dp(4), dp(4), dp(4))
            layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT)
        }

        // Toolbar Buttons
        addToolbarButton("EN → HI") { actionListener?.onDirectionSelected("en", "hi", false) }
        addToolbarButton("HI → EN") { actionListener?.onDirectionSelected("hi", "en", false) }
        addToolbarButton("TE → HI") { actionListener?.onDirectionSelected("te", "hi", false) }
        addToolbarButton("HI → TE") { actionListener?.onDirectionSelected("hi", "te", false) }
        addToolbarButton("AUTO") { actionListener?.onDirectionSelected("auto", "hi", true) }
        addToolbarButton("📋 Clipboard") { actionListener?.onClipboardTranslateRequested() }
        addToolbarButton("Translate") { actionListener?.onTranslateCurrentTextRequested() }
        addToolbarButton("🎨 Theme") { actionListener?.onThemeCycleRequested() }
        addToolbarButton("⌨ Switch") { actionListener?.onSwitchToSystemKeyboardRequested() }

        toolbarScroll.addView(toolbarLayout)
        addView(toolbarScroll)

        // 2. Translation Assistant Card
        assistantCard = LinearLayout(context).apply {
            orientation = VERTICAL
            setPadding(dp(8), dp(6), dp(8), dp(6))
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
        }

        val metaRow = LinearLayout(context).apply {
            orientation = HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
        }

        statusBadgeText = TextView(context).apply {
            text = "📱 On-device"
            textSize = 11f
            setTypeface(null, Typeface.BOLD)
            layoutParams = LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f)
        }

        btnCopy = Button(context).apply {
            text = "Copy"
            textSize = 11f
            layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, dp(32))
            setOnClickListener { actionListener?.onCopyRequested() }
        }

        btnInsert = Button(context).apply {
            text = "Insert"
            textSize = 11f
            layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, dp(32))
            setOnClickListener { actionListener?.onInsertRequested() }
        }

        metaRow.addView(statusBadgeText)
        metaRow.addView(btnCopy)
        metaRow.addView(btnInsert)
        assistantCard.addView(metaRow)

        previewText = TextView(context).apply {
            text = "Tap 'Translate' or 'Clipboard' to start"
            textSize = 13f
            setPadding(0, dp(4), 0, dp(4))
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
        }
        assistantCard.addView(previewText)
        addView(assistantCard)

        // 3. Compact Keypad
        keypadLayout = LinearLayout(context).apply {
            orientation = VERTICAL
            setPadding(dp(4), dp(2), dp(4), dp(6))
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
        }

        val rows = listOf(
            listOf("Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"),
            listOf("A", "S", "D", "F", "G", "H", "J", "K", "L"),
            listOf("Z", "X", "C", "V", "B", "N", "M", "⌫")
        )

        rows.forEach { rowKeys ->
            val rowLayout = LinearLayout(context).apply {
                orientation = HORIZONTAL
                gravity = Gravity.CENTER
                layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, dp(40))
            }
            rowKeys.forEach { key ->
                val btn = Button(context).apply {
                    text = key
                    textSize = 14f
                    layoutParams = LayoutParams(0, LayoutParams.MATCH_PARENT, 1f).apply {
                        setMargins(dp(1), dp(1), dp(1), dp(1))
                    }
                    setOnClickListener {
                        if (key == "⌫") actionListener?.onBackspacePress()
                        else actionListener?.onKeyPress(key.lowercase())
                    }
                }
                rowLayout.addView(btn)
            }
            keypadLayout.addView(rowLayout)
        }

        // Bottom space/action row
        val bottomRow = LinearLayout(context).apply {
            orientation = HORIZONTAL
            gravity = Gravity.CENTER
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, dp(40))
        }

        val btnComma = Button(context).apply {
            text = ","
            layoutParams = LayoutParams(0, LayoutParams.MATCH_PARENT, 1.5f)
            setOnClickListener { actionListener?.onKeyPress(",") }
        }

        val btnSpace = Button(context).apply {
            text = "SPACE"
            layoutParams = LayoutParams(0, LayoutParams.MATCH_PARENT, 5f)
            setOnClickListener { actionListener?.onSpacePress() }
        }

        val btnPeriod = Button(context).apply {
            text = "."
            layoutParams = LayoutParams(0, LayoutParams.MATCH_PARENT, 1.5f)
            setOnClickListener { actionListener?.onKeyPress(".") }
        }

        val btnEnter = Button(context).apply {
            text = "↵"
            layoutParams = LayoutParams(0, LayoutParams.MATCH_PARENT, 2f)
            setOnClickListener { actionListener?.onEnterPress() }
        }

        bottomRow.addView(btnComma)
        bottomRow.addView(btnSpace)
        bottomRow.addView(btnPeriod)
        bottomRow.addView(btnEnter)
        keypadLayout.addView(bottomRow)

        addView(keypadLayout)
    }

    private fun addToolbarButton(label: String, onClick: () -> Unit) {
        val dp = { value: Int ->
            TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, value.toFloat(), resources.displayMetrics).toInt()
        }
        val btn = Button(context).apply {
            text = label
            textSize = 12f
            setPadding(dp(8), dp(2), dp(8), dp(2))
            layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, dp(36)).apply {
                setMargins(dp(2), 0, dp(2), 0)
            }
            setOnClickListener { onClick() }
        }
        toolbarLayout.addView(btn)
    }

    fun applyTheme(theme: ColorTheme) {
        currentTheme = theme
        val colors = ThemeManager.getThemeColors(theme)
        setBackgroundColor(colors.background)
        assistantCard.setBackgroundColor(colors.surface)
        previewText.setTextColor(colors.textPrimary)
        statusBadgeText.setTextColor(colors.accent)
    }

    fun updateState(state: KeyboardUiState) {
        if (state.isSensitiveInput) {
            assistantCard.visibility = View.VISIBLE
            previewText.text = "🔒 Password/sensitive field detected. Translation assistant inactive."
            btnInsert.isEnabled = false
            btnCopy.isEnabled = false
            return
        }

        assistantCard.visibility = View.VISIBLE
        statusBadgeText.text = "${state.statusBadge} • [${state.sourceLang.uppercase()} → ${state.targetLang.uppercase()}] (${state.currentTone})"
        
        if (state.isProcessing) {
            previewText.text = "Translating..."
            btnInsert.isEnabled = false
            btnCopy.isEnabled = false
        } else if (state.translationPreview.isNotBlank()) {
            previewText.text = state.translationPreview
            btnInsert.isEnabled = true
            btnCopy.isEnabled = true
        } else {
            previewText.text = "Tap 'Translate' or '📋 Clipboard' to translate"
            btnInsert.isEnabled = false
            btnCopy.isEnabled = false
        }
    }
}
