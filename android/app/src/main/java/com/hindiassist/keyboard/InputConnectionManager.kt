package com.hindiassist.keyboard

import android.text.InputType
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputConnection

class InputConnectionManager {

    fun isSensitiveField(editorInfo: EditorInfo?): Boolean {
        if (editorInfo == null) return false

        val inputType = editorInfo.inputType
        val variation = inputType and InputType.TYPE_MASK_VARIATION
        val clazz = inputType and InputType.TYPE_MASK_CLASS

        val isTextPassword = clazz == InputType.TYPE_CLASS_TEXT && (
                variation == InputType.TYPE_TEXT_VARIATION_PASSWORD ||
                variation == InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD ||
                variation == InputType.TYPE_TEXT_VARIATION_WEB_PASSWORD
        )

        val isNumberPassword = clazz == InputType.TYPE_CLASS_NUMBER && (
                variation == InputType.TYPE_NUMBER_VARIATION_PASSWORD
        )

        return isTextPassword || isNumberPassword
    }

    fun insertText(ic: InputConnection?, text: String) {
        if (ic == null || text.isEmpty()) return
        // Legitimate, explicit insertion into current text field
        ic.commitText(text, 1)
    }

    fun replaceSelectedText(ic: InputConnection?, replacement: String) {
        if (ic == null) return
        ic.commitText(replacement, 1)
    }

    fun getSelectedText(ic: InputConnection?): String? {
        if (ic == null) return null
        val selected = ic.getSelectedText(0)
        return selected?.toString()?.trim()
    }

    fun sendBackspace(ic: InputConnection?) {
        ic?.deleteSurroundingText(1, 0)
    }

    fun sendEnter(ic: InputConnection?, editorInfo: EditorInfo?) {
        if (ic == null) return
        val action = editorInfo?.imeOptions?.and(EditorInfo.IME_MASK_ACTION) ?: EditorInfo.IME_ACTION_NONE
        if (action != EditorInfo.IME_ACTION_NONE && action != EditorInfo.IME_ACTION_UNSPECIFIED) {
            ic.performEditorAction(action)
        } else {
            ic.commitText("\n", 1)
        }
    }
}
