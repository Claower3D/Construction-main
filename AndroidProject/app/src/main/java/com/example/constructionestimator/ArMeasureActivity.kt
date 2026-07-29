package com.example.constructionestimator

import android.Manifest
import android.content.pm.PackageManager
import android.opengl.GLES20
import android.opengl.GLSurfaceView
import android.os.Bundle
import android.view.MotionEvent
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer
import java.text.DecimalFormat
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.opengles.GL10
import kotlin.math.sqrt

/**
 * AR-измерения v1.0 — ARCore-based measurement Activity
 *
 * Использует камеру + OpenGL для AR-рулетки.
 * Текущая реализация: симуляция AR (без полной ARCore зависимости)
 * * Отмечайте точки касанием экрана
 * * Автоматический расчёт расстояний и площадей
 * * Генерация данных для сметы
 *
 * Для полного ARCore потребуется:
 *   implementation "com.google.ar:core:1.41.0"
 *   implementation "com.google.ar.sceneform:sceneform:1.17.1"
 */
class ArMeasureActivity : AppCompatActivity() {

    // ========== Data classes ==========
    data class ARPoint(val x: Float, val y: Float, val z: Float) {
        fun distanceTo(other: ARPoint): Float {
            val dx = x - other.x
            val dy = y - other.y
            val dz = z - other.z
            return sqrt(dx * dx + dy * dy + dz * dz)
        }
    }

    data class Measurement(
        val points: List<ARPoint>,
        val distanceMeters: Float,
        val type: MeasureType
    )

    enum class MeasureType { DISTANCE, WIDTH, HEIGHT, AREA, PERIMETER }
    enum class MeasureMode { POINT, LINE, AREA }

    // ========== State ==========
    private val points = mutableListOf<ARPoint>()
    private val measurements = mutableListOf<Measurement>()
    private var currentMode = MeasureMode.LINE
    private val df = DecimalFormat("#.##")

    // ========== Views ==========
    private lateinit var glSurfaceView: GLSurfaceView
    private lateinit var infoText: TextView
    private lateinit var measurementsList: LinearLayout
    private lateinit var modeButton: Button
    private lateinit var undoButton: Button
    private lateinit var clearButton: Button
    private lateinit var applyButton: Button
    private lateinit var statusText: TextView

    // ========== Renderer ==========
    private var renderer: ARRenderer? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_ar_measure)

        initViews()
        setupButtons()
        checkCamera()
    }

    private fun initViews() {
        glSurfaceView = findViewById(R.id.arSurfaceView)
        infoText = findViewById(R.id.arInfoText)
        measurementsList = findViewById(R.id.arMeasurementsList)
        modeButton = findViewById(R.id.arModeBtn)
        undoButton = findViewById(R.id.arUndoBtn)
        clearButton = findViewById(R.id.arClearBtn)
        applyButton = findViewById(R.id.arApplyBtn)
        statusText = findViewById(R.id.arStatusText)

        // Setup GL surface
        glSurfaceView.setEGLContextClientVersion(2)
        renderer = ARRenderer()
        glSurfaceView.setRenderer(renderer)
        glSurfaceView.renderMode = GLSurfaceView.RENDERMODE_CONTINUOUSLY

        glSurfaceView.setOnTouchListener { _, event ->
            if (event.action == MotionEvent.ACTION_DOWN) {
                onScreenTap(event.x, event.y)
            }
            true
        }

        updateUI()
    }

    private fun setupButtons() {
        modeButton.setOnClickListener { toggleMode() }
        undoButton.setOnClickListener { undoPoint() }
        clearButton.setOnClickListener { clearAll() }
        applyButton.setOnClickListener { applyMeasurements() }
        
        findViewById<Button>(R.id.arBackBtn)?.setOnClickListener { finish() }
    }

    private fun checkCamera() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) 
            != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.CAMERA), 100)
        } else {
            statusText.text = "📐 Коснитесь экрана для установки точек измерения"
        }
    }

    // ========== TAP → Point ==========
    private fun onScreenTap(screenX: Float, screenY: Float) {
        // Simulate AR hit test: convert screen coords to world coords
        // In real ARCore, this calls frame.hitTest(tap) → hitResult.createAnchor()
        val width = glSurfaceView.width.toFloat()
        val height = glSurfaceView.height.toFloat()
        
        // Simulate world position on ground plane (y=0)
        val worldX = (screenX / width - 0.5f) * 5f   // ±2.5m range
        val worldZ = (screenY / height - 0.5f) * 5f   // ±2.5m depth
        val worldY = 0f  // ground plane

        val point = ARPoint(worldX, worldY, worldZ)
        points.add(point)
        renderer?.addPoint(point)

        // Auto-measure based on mode
        when (currentMode) {
            MeasureMode.LINE -> {
                if (points.size >= 2) {
                    val last = points.takeLast(2)
                    val dist = last[0].distanceTo(last[1])
                    measurements.add(Measurement(last, dist, MeasureType.DISTANCE))
                    renderer?.addLine(last[0], last[1])
                }
            }
            MeasureMode.AREA -> {
                if (points.size >= 3) {
                    // Calculate area from polygon vertices (Shoelace formula, projected to XZ)
                    val area = calcPolygonArea(points)
                    val perim = calcPerimeter(points)
                    // Replace last area measurement
                    measurements.removeAll { it.type == MeasureType.AREA }
                    measurements.add(Measurement(points.toList(), area, MeasureType.AREA))
                    measurements.add(Measurement(points.toList(), perim, MeasureType.PERIMETER))
                }
            }
            MeasureMode.POINT -> {
                // Just mark points, no measurement
            }
        }

        updateUI()
    }

    // ========== CALCULATIONS ==========
    private fun calcPolygonArea(pts: List<ARPoint>): Float {
        // Shoelace formula on XZ plane
        var area = 0f
        val n = pts.size
        for (i in 0 until n) {
            val j = (i + 1) % n
            area += pts[i].x * pts[j].z
            area -= pts[j].x * pts[i].z
        }
        return kotlin.math.abs(area) / 2f
    }

    private fun calcPerimeter(pts: List<ARPoint>): Float {
        var perimeter = 0f
        for (i in pts.indices) {
            perimeter += pts[i].distanceTo(pts[(i + 1) % pts.size])
        }
        return perimeter
    }

    // ========== ACTIONS ==========
    private fun toggleMode() {
        currentMode = when (currentMode) {
            MeasureMode.LINE -> MeasureMode.AREA
            MeasureMode.AREA -> MeasureMode.POINT
            MeasureMode.POINT -> MeasureMode.LINE
        }
        clearAll()
        updateUI()
    }

    private fun undoPoint() {
        if (points.isNotEmpty()) {
            points.removeAt(points.size - 1)
            renderer?.removeLastPoint()
            // Recalculate measurements
            recalcMeasurements()
            updateUI()
        }
    }

    private fun clearAll() {
        points.clear()
        measurements.clear()
        renderer?.clearAll()
        updateUI()
    }

    private fun recalcMeasurements() {
        measurements.clear()
        when (currentMode) {
            MeasureMode.LINE -> {
                for (i in 0 until points.size - 1) {
                    val pair = listOf(points[i], points[i + 1])
                    measurements.add(Measurement(pair, pair[0].distanceTo(pair[1]), MeasureType.DISTANCE))
                }
            }
            MeasureMode.AREA -> {
                if (points.size >= 3) {
                    measurements.add(Measurement(points.toList(), calcPolygonArea(points), MeasureType.AREA))
                    measurements.add(Measurement(points.toList(), calcPerimeter(points), MeasureType.PERIMETER))
                }
            }
            MeasureMode.POINT -> { /* no measurements */ }
        }
    }

    private fun applyMeasurements() {
        if (measurements.isEmpty()) {
            Toast.makeText(this, "Нет измерений для применения", Toast.LENGTH_SHORT).show()
            return
        }

        val resultData = Bundle().apply {
            // Distances
            val distances = measurements.filter { it.type == MeasureType.DISTANCE }.map { it.distanceMeters }
            putFloatArray("distances", distances.toFloatArray())
            
            // Area
            val area = measurements.find { it.type == MeasureType.AREA }?.distanceMeters ?: 0f
            putFloat("area", area)
            
            // Perimeter
            val perimeter = measurements.find { it.type == MeasureType.PERIMETER }?.distanceMeters ?: 0f
            putFloat("perimeter", perimeter)
            
            // Total distance
            putFloat("totalDistance", distances.sum())
        }

        val intent = android.content.Intent().apply { putExtras(resultData) }
        setResult(RESULT_OK, intent)

        Toast.makeText(this, "✅ Измерения сохранены", Toast.LENGTH_SHORT).show()
        finish()
    }

    // ========== UI UPDATE ==========
    private fun updateUI() {
        val modeLabel = when (currentMode) {
            MeasureMode.LINE -> "📏 Линия"
            MeasureMode.AREA -> "📐 Площадь"
            MeasureMode.POINT -> "📍 Точка"
        }
        modeButton.text = modeLabel
        
        infoText.text = when (currentMode) {
            MeasureMode.LINE -> "Касайтесь для отметки точек → расстояние"
            MeasureMode.AREA -> "Отметьте углы области (≥3 точки)"
            MeasureMode.POINT -> "Отмечайте точки для привязки"
        }

        measurementsList.removeAllViews()
        measurements.forEach { m ->
            val tv = TextView(this).apply {
                val icon = when (m.type) {
                    MeasureType.DISTANCE -> "📏"
                    MeasureType.WIDTH -> "↔️"
                    MeasureType.HEIGHT -> "↕️"
                    MeasureType.AREA -> "📐"
                    MeasureType.PERIMETER -> "🔲"
                }
                val unit = if (m.type == MeasureType.AREA) "м²" else "м"
                text = "$icon ${typeLabel(m.type)}: ${df.format(m.distanceMeters)} $unit"
                textSize = 15f
                setTextColor(0xFFf1f5f9.toInt())
                setPadding(16, 8, 16, 8)
            }
            measurementsList.addView(tv)
        }

        // Total
        if (measurements.isNotEmpty()) {
            val totalDist = measurements.filter { it.type == MeasureType.DISTANCE }.sumOf { it.distanceMeters.toDouble() }
            if (totalDist > 0) {
                val totalTv = TextView(this).apply {
                    text = "📊 Итого: ${df.format(totalDist)} м"
                    textSize = 16f
                    setTextColor(0xFF10b981.toInt())
                    setPadding(16, 12, 16, 8)
                    setTypeface(typeface, android.graphics.Typeface.BOLD)
                }
                measurementsList.addView(totalTv)
            }
        }

        applyButton.visibility = if (measurements.isNotEmpty()) View.VISIBLE else View.GONE
    }

    private fun typeLabel(t: MeasureType) = when (t) {
        MeasureType.DISTANCE -> "Расстояние"
        MeasureType.WIDTH -> "Ширина"
        MeasureType.HEIGHT -> "Высота"
        MeasureType.AREA -> "Площадь"
        MeasureType.PERIMETER -> "Периметр"
    }

    // ========== GL Renderer ==========
    inner class ARRenderer : GLSurfaceView.Renderer {
        private val glPoints = mutableListOf<FloatArray>()
        private val glLines = mutableListOf<Pair<FloatArray, FloatArray>>()
        private var pointBuffer: FloatBuffer? = null
        private var program = 0

        private val vertexShader = """
            attribute vec4 vPosition;
            void main() { gl_Position = vPosition; gl_PointSize = 12.0; }
        """.trimIndent()

        private val fragmentShader = """
            precision mediump float;
            uniform vec4 uColor;
            void main() { gl_FragColor = uColor; }
        """.trimIndent()

        fun addPoint(p: ARPoint) {
            glPoints.add(floatArrayOf(p.x / 3f, -p.z / 3f, 0f)) // normalized
        }

        fun addLine(a: ARPoint, b: ARPoint) {
            glLines.add(
                floatArrayOf(a.x / 3f, -a.z / 3f, 0f) to floatArrayOf(b.x / 3f, -b.z / 3f, 0f)
            )
        }

        fun removeLastPoint() { if (glPoints.isNotEmpty()) glPoints.removeAt(glPoints.size - 1) }
        fun clearAll() { glPoints.clear(); glLines.clear() }

        override fun onSurfaceCreated(gl: GL10?, config: EGLConfig?) {
            GLES20.glClearColor(0.04f, 0.08f, 0.16f, 1f) // dark bg
            program = createProgram(vertexShader, fragmentShader)
        }

        override fun onSurfaceChanged(gl: GL10?, width: Int, height: Int) {
            GLES20.glViewport(0, 0, width, height)
        }

        override fun onDrawFrame(gl: GL10?) {
            GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT)
            if (program == 0) return

            GLES20.glUseProgram(program)
            val posHandle = GLES20.glGetAttribLocation(program, "vPosition")
            val colorHandle = GLES20.glGetUniformLocation(program, "uColor")

            // Draw grid
            drawGrid(posHandle, colorHandle)

            // Draw lines
            GLES20.glLineWidth(3f)
            GLES20.glUniform4f(colorHandle, 0.23f, 0.51f, 0.96f, 1f) // blue
            for ((a, b) in glLines) {
                val buf = floatArrayToBuffer(a + b)
                GLES20.glEnableVertexAttribArray(posHandle)
                GLES20.glVertexAttribPointer(posHandle, 3, GLES20.GL_FLOAT, false, 0, buf)
                GLES20.glDrawArrays(GLES20.GL_LINES, 0, 2)
            }

            // Draw points
            GLES20.glUniform4f(colorHandle, 0.06f, 0.73f, 0.49f, 1f) // green
            for (p in glPoints) {
                val buf = floatArrayToBuffer(p)
                GLES20.glEnableVertexAttribArray(posHandle)
                GLES20.glVertexAttribPointer(posHandle, 3, GLES20.GL_FLOAT, false, 0, buf)
                GLES20.glDrawArrays(GLES20.GL_POINTS, 0, 1)
            }
        }

        private fun drawGrid(posH: Int, colH: Int) {
            GLES20.glLineWidth(1f)
            GLES20.glUniform4f(colH, 0.15f, 0.2f, 0.3f, 0.5f)
            val step = 0.2f
            for (i in -5..5) {
                val pos = i * step
                val vLine = floatArrayOf(pos, -1f, 0f, pos, 1f, 0f)
                val hLine = floatArrayOf(-1f, pos, 0f, 1f, pos, 0f)
                drawLineArray(posH, vLine)
                drawLineArray(posH, hLine)
            }
        }

        private fun drawLineArray(posH: Int, arr: FloatArray) {
            val buf = floatArrayToBuffer(arr)
            GLES20.glEnableVertexAttribArray(posH)
            GLES20.glVertexAttribPointer(posH, 3, GLES20.GL_FLOAT, false, 0, buf)
            GLES20.glDrawArrays(GLES20.GL_LINES, 0, arr.size / 3)
        }

        private fun floatArrayToBuffer(arr: FloatArray): FloatBuffer {
            return ByteBuffer.allocateDirect(arr.size * 4)
                .order(ByteOrder.nativeOrder())
                .asFloatBuffer()
                .put(arr)
                .apply { position(0) }
        }

        private fun createProgram(vSource: String, fSource: String): Int {
            val vs = loadShader(GLES20.GL_VERTEX_SHADER, vSource)
            val fs = loadShader(GLES20.GL_FRAGMENT_SHADER, fSource)
            return GLES20.glCreateProgram().also {
                GLES20.glAttachShader(it, vs)
                GLES20.glAttachShader(it, fs)
                GLES20.glLinkProgram(it)
            }
        }

        private fun loadShader(type: Int, source: String): Int {
            return GLES20.glCreateShader(type).also {
                GLES20.glShaderSource(it, source)
                GLES20.glCompileShader(it)
            }
        }
    }

    override fun onRequestPermissionsResult(code: Int, perms: Array<String>, results: IntArray) {
        super.onRequestPermissionsResult(code, perms, results)
        if (code == 100 && results.isNotEmpty() && results[0] == PackageManager.PERMISSION_GRANTED) {
            statusText.text = "📐 Коснитесь экрана для установки точек"
        } else {
            Toast.makeText(this, "Для AR-измерений нужна камера", Toast.LENGTH_LONG).show()
            finish()
        }
    }
}
