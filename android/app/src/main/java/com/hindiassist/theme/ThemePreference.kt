package com.hindiassist.theme

enum class ColorTheme(val displayName: String) {
    DAY("Day"),
    NIGHT("Night"),
    BLUE("Blue"),
    GREEN("Green"),
    READING("Reading / Eye Comfort")
}

data class ThemePreference(
    val currentTheme: ColorTheme = ColorTheme.DAY,
    val followAppTheme: Boolean = true,
    val warmthLevel: Int = 1, // 0: Low, 1: Medium, 2: High (for Reading mode)
    val highContrast: Boolean = false,
    val reducedMotion: Boolean = false,
    val textSizeScale: Float = 1.0f
)
