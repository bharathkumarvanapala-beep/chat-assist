package com.hindiassist.theme

import android.content.Context
import android.graphics.Color
import androidx.annotation.ColorInt

object ThemeManager {

    data class ThemeColors(
        @ColorInt val background: Int,
        @ColorInt val surface: Int,
        @ColorInt val surfaceSecondary: Int,
        @ColorInt val textPrimary: Int,
        @ColorInt val textSecondary: Int,
        @ColorInt val accent: Int,
        @ColorInt val border: Int,
        @ColorInt val keyBackground: Int
    )

    fun getThemeColors(theme: ColorTheme): ThemeColors {
        return when (theme) {
            ColorTheme.DAY -> ThemeColors(
                background = Color.parseColor("#F8FAFC"),
                surface = Color.parseColor("#FFFFFF"),
                surfaceSecondary = Color.parseColor("#F1F5F9"),
                textPrimary = Color.parseColor("#0F172A"),
                textSecondary = Color.parseColor("#475569"),
                accent = Color.parseColor("#4F46E5"),
                border = Color.parseColor("#E2E8F0"),
                keyBackground = Color.parseColor("#FFFFFF")
            )
            ColorTheme.NIGHT -> ThemeColors(
                background = Color.parseColor("#0B0F19"),
                surface = Color.parseColor("#151D2F"),
                surfaceSecondary = Color.parseColor("#1E293B"),
                textPrimary = Color.parseColor("#F8FAFC"),
                textSecondary = Color.parseColor("#94A3B8"),
                accent = Color.parseColor("#6366F1"),
                border = Color.parseColor("#334155"),
                keyBackground = Color.parseColor("#1E293B")
            )
            ColorTheme.BLUE -> ThemeColors(
                background = Color.parseColor("#0A192F"),
                surface = Color.parseColor("#112240"),
                surfaceSecondary = Color.parseColor("#233554"),
                textPrimary = Color.parseColor("#CCD6F6"),
                textSecondary = Color.parseColor("#8892B0"),
                accent = Color.parseColor("#38BDF8"),
                border = Color.parseColor("#1E3A8A"),
                keyBackground = Color.parseColor("#172A45")
            )
            ColorTheme.GREEN -> ThemeColors(
                background = Color.parseColor("#0A1C16"),
                surface = Color.parseColor("#122B23"),
                surfaceSecondary = Color.parseColor("#1D3D32"),
                textPrimary = Color.parseColor("#E2E8F0"),
                textSecondary = Color.parseColor("#86EFAC"),
                accent = Color.parseColor("#10B981"),
                border = Color.parseColor("#065F46"),
                keyBackground = Color.parseColor("#16382D")
            )
            ColorTheme.READING -> ThemeColors(
                background = Color.parseColor("#F7F3E8"),
                surface = Color.parseColor("#EFE7D5"),
                surfaceSecondary = Color.parseColor("#E4D9C3"),
                textPrimary = Color.parseColor("#383226"),
                textSecondary = Color.parseColor("#695D47"),
                accent = Color.parseColor("#B45309"),
                border = Color.parseColor("#DDD2BC"),
                keyBackground = Color.parseColor("#FAF7EF")
            )
        }
    }
}
