package com.hindiassist.clipboard

import android.content.ClipData
import android.content.ClipboardManager as AndroidClipboardManager
import android.content.Context

/**
 * Privacy-First Clipboard Manager
 * 
 * Enforces explicit-only clipboard access:
 * - NEVER registers continuous clipboard listeners.
 * - NEVER uploads clipboard contents.
 * - Reads clipboard ONLY when invoked by an explicit user tap.
 */
class ClipboardManager(private val context: Context) {

    private val androidClipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as? AndroidClipboardManager

    fun readExplicitClipboard(): String? {
        val clip = androidClipboard?.primaryClip ?: return null
        if (clip.itemCount > 0) {
            val item = clip.getItemAt(0)
            return item.text?.toString()?.trim()
        }
        return null
    }

    fun copyToClipboard(label: String, text: String) {
        val clip = ClipData.newPlainText(label, text)
        androidClipboard?.setPrimaryClip(clip)
    }
}
