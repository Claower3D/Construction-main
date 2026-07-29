package com.example.constructionestimator

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.cardview.widget.CardView
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.*

/**
 * Engineer Cabinet Activity
 * Кабинет инженера - управление заявками и проектами
 */
class EngineerActivity : AppCompatActivity() {

    private lateinit var tabDashboard: TextView
    private lateinit var tabRequests: TextView
    private lateinit var tabProjects: TextView
    private lateinit var tabProfile: TextView
    private lateinit var contentContainer: FrameLayout
    private lateinit var statsTotal: TextView
    private lateinit var statsInWork: TextView
    private lateinit var statsCompleted: TextView
    private lateinit var statsRating: TextView

    private var currentTab = "dashboard"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_engineer)

        initViews()
        setupTabs()
        loadDashboard()
    }

    private fun initViews() {
        // Back button
        findViewById<View>(R.id.backButton).setOnClickListener {
            finish()
        }

        // Profile button
        findViewById<View>(R.id.profileButton).setOnClickListener {
            switchTab("profile")
        }

        // Tabs
        tabDashboard = findViewById(R.id.tabDashboard)
        tabRequests = findViewById(R.id.tabRequests)
        tabProjects = findViewById(R.id.tabProjects)
        tabProfile = findViewById(R.id.tabProfile)

        // Stats
        statsTotal = findViewById(R.id.statsTotal)
        statsInWork = findViewById(R.id.statsInWork)
        statsCompleted = findViewById(R.id.statsCompleted)
        statsRating = findViewById(R.id.statsRating)

        // Content container
        contentContainer = findViewById(R.id.contentContainer)
    }

    private fun setupTabs() {
        tabDashboard.setOnClickListener { switchTab("dashboard") }
        tabRequests.setOnClickListener { switchTab("requests") }
        tabProjects.setOnClickListener { switchTab("projects") }
        tabProfile.setOnClickListener { switchTab("profile") }
    }

    private fun switchTab(tab: String) {
        currentTab = tab

        // Update tab styles
        val tabs = listOf(tabDashboard, tabRequests, tabProjects, tabProfile)
        tabs.forEach { it.isSelected = false }

        when (tab) {
            "dashboard" -> {
                tabDashboard.isSelected = true
                loadDashboard()
            }
            "requests" -> {
                tabRequests.isSelected = true
                loadRequests()
            }
            "projects" -> {
                tabProjects.isSelected = true
                loadProjects()
            }
            "profile" -> {
                tabProfile.isSelected = true
                loadProfile()
            }
        }
    }

    private fun loadDashboard() {
        // Update stats
        val summary = EngineerDataManager.getSummary(this)
        statsTotal.text = summary.totalProjects.toString()
        statsInWork.text = summary.inWork.toString()
        statsCompleted.text = summary.completed.toString()
        statsRating.text = if (summary.rating > 0) String.format("%.1f", summary.rating) else "—"

        // Show dashboard content
        val view = layoutInflater.inflate(R.layout.content_engineer_dashboard, contentContainer, false)
        contentContainer.removeAllViews()
        contentContainer.addView(view)

        // Quick actions
        view.findViewById<CardView>(R.id.actionFindRequests).setOnClickListener {
            switchTab("requests")
        }
        view.findViewById<CardView>(R.id.actionEditProfile).setOnClickListener {
            showProfileEditor()
        }
        view.findViewById<CardView>(R.id.actionGuide).setOnClickListener {
            showSpecializationGuide()
        }

        // Profile completeness warning
        val profile = EngineerDataManager.getProfile(this)
        val warningCard = view.findViewById<CardView>(R.id.profileWarningCard)
        if (!profile.isComplete) {
            warningCard.visibility = View.VISIBLE
            view.findViewById<Button>(R.id.fillProfileButton).setOnClickListener {
                showProfileEditor()
            }
        } else {
            warningCard.visibility = View.GONE
        }

        // Load recent requests preview
        loadRecentRequestsPreview(view)
    }

    private fun loadRecentRequestsPreview(view: View) {
        val recyclerView = view.findViewById<RecyclerView>(R.id.recentRequestsRecycler)
        recyclerView.layoutManager = LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false)

        val requests = EngineerDataManager.getAvailableRequests(this).take(3)
        recyclerView.adapter = RequestPreviewAdapter(requests) { request ->
            showRequestDetails(request)
        }
    }

    private fun loadRequests() {
        val view = layoutInflater.inflate(R.layout.content_engineer_requests, contentContainer, false)
        contentContainer.removeAllViews()
        contentContainer.addView(view)

        val recyclerView = view.findViewById<RecyclerView>(R.id.requestsRecycler)
        recyclerView.layoutManager = LinearLayoutManager(this)

        val requests = EngineerDataManager.getAvailableRequests(this)
        
        if (requests.isEmpty()) {
            view.findViewById<View>(R.id.emptyState).visibility = View.VISIBLE
            recyclerView.visibility = View.GONE
        } else {
            view.findViewById<View>(R.id.emptyState).visibility = View.GONE
            recyclerView.visibility = View.VISIBLE
            recyclerView.adapter = RequestsAdapter(requests, { request ->
                showRequestDetails(request)
            }, { request ->
                takeRequest(request)
            })
        }

        // Filter
        view.findViewById<Spinner>(R.id.categoryFilter).onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                filterRequests(position)
            }
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }
    }

    private fun filterRequests(categoryIndex: Int) {
        // Implement filtering logic
        Toast.makeText(this, "Фильтр применён", Toast.LENGTH_SHORT).show()
    }

    private fun loadProjects() {
        val view = layoutInflater.inflate(R.layout.content_engineer_projects, contentContainer, false)
        contentContainer.removeAllViews()
        contentContainer.addView(view)

        val recyclerView = view.findViewById<RecyclerView>(R.id.projectsRecycler)
        recyclerView.layoutManager = LinearLayoutManager(this)

        val projects = EngineerDataManager.getMyProjects(this)

        if (projects.isEmpty()) {
            view.findViewById<View>(R.id.emptyState).visibility = View.VISIBLE
            recyclerView.visibility = View.GONE
            view.findViewById<Button>(R.id.findRequestsButton).setOnClickListener {
                switchTab("requests")
            }
        } else {
            view.findViewById<View>(R.id.emptyState).visibility = View.GONE
            recyclerView.visibility = View.VISIBLE
            recyclerView.adapter = ProjectsAdapter(projects, { project ->
                showProjectDetails(project)
            }, { project ->
                submitProject(project)
            })
        }
    }

    private fun loadProfile() {
        val view = layoutInflater.inflate(R.layout.content_engineer_profile, contentContainer, false)
        contentContainer.removeAllViews()
        contentContainer.addView(view)

        val profile = EngineerDataManager.getProfile(this)

        // Set profile data
        view.findViewById<TextView>(R.id.profileName).text = profile.fullName.ifEmpty { "Не указано" }
        view.findViewById<TextView>(R.id.profileType).text = if (profile.isCompany) profile.companyName else "Физическое лицо"
        view.findViewById<TextView>(R.id.profileCity).text = "📍 ${profile.city.ifEmpty { "Не указано" }}"
        view.findViewById<TextView>(R.id.profilePhone).text = "📱 ${profile.phone.ifEmpty { "Не указано" }}"
        view.findViewById<TextView>(R.id.profileEmail).text = "📧 ${profile.email.ifEmpty { "Не указано" }}"

        // Specializations
        val specContainer = view.findViewById<FlexboxLayout>(R.id.specializationsContainer)
        if (profile.specializations.isEmpty()) {
            val emptyText = TextView(this).apply {
                text = "Не указаны"
                setTextColor(resources.getColor(R.color.text_muted, theme))
            }
            specContainer.addView(emptyText)
        } else {
            profile.specializations.forEach { spec ->
                val chip = layoutInflater.inflate(R.layout.chip_specialization, specContainer, false) as TextView
                chip.text = EngineerDataManager.getSpecializationLabel(spec)
                specContainer.addView(chip)
            }
        }

        // Experience
        view.findViewById<TextView>(R.id.profileExperience).text = "${profile.experience} лет"
        view.findViewById<TextView>(R.id.profileProjects).text = "${profile.projectsCompleted} проектов"

        // Hourly rate
        view.findViewById<TextView>(R.id.profileRate).text = if (profile.hourlyRate > 0) {
            formatPrice(profile.hourlyRate.toLong()) + "/час"
        } else {
            "Не указан"
        }

        // Edit button
        view.findViewById<Button>(R.id.editProfileButton).setOnClickListener {
            showProfileEditor()
        }
    }

    private fun showRequestDetails(request: EngineerRequest) {
        val intent = Intent(this, RequestDetailsActivity::class.java)
        intent.putExtra("request_id", request.id)
        startActivity(intent)
    }

    private fun showProjectDetails(project: EngineerProject) {
        val intent = Intent(this, ProjectDetailsActivity::class.java)
        intent.putExtra("project_id", project.id)
        startActivity(intent)
    }

    private fun takeRequest(request: EngineerRequest) {
        AlertDialog.Builder(this)
            .setTitle("Откликнуться на заявку?")
            .setMessage("Вы хотите взять заявку \"${request.objectName}\"?")
            .setPositiveButton("Да") { _, _ ->
                EngineerDataManager.acceptRequest(this, request.id)
                Toast.makeText(this, "✅ Заявка принята!", Toast.LENGTH_SHORT).show()
                switchTab("projects")
            }
            .setNegativeButton("Отмена", null)
            .show()
    }

    private fun submitProject(project: EngineerProject) {
        AlertDialog.Builder(this)
            .setTitle("Сдать работу?")
            .setMessage("Вы уверены, что хотите сдать проект \"${project.objectName}\" на проверку?")
            .setPositiveButton("Сдать") { _, _ ->
                EngineerDataManager.submitProject(this, project.id)
                Toast.makeText(this, "📤 Работа отправлена на проверку!", Toast.LENGTH_SHORT).show()
                loadProjects()
            }
            .setNegativeButton("Отмена", null)
            .show()
    }

    private fun showProfileEditor() {
        val intent = Intent(this, EngineerProfileEditorActivity::class.java)
        startActivityForResult(intent, REQUEST_EDIT_PROFILE)
    }

    private fun showSpecializationGuide() {
        val specializations = EngineerDataManager.getAllSpecializations()
        val items = specializations.map { "${it.icon} ${it.name}\n${it.description}" }.toTypedArray()

        AlertDialog.Builder(this)
            .setTitle("📚 Справочник специализаций")
            .setItems(items, null)
            .setPositiveButton("OK", null)
            .show()
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQUEST_EDIT_PROFILE && resultCode == RESULT_OK) {
            when (currentTab) {
                "dashboard" -> loadDashboard()
                "profile" -> loadProfile()
            }
        }
    }

    private fun formatPrice(price: Long): String {
        val format = NumberFormat.getInstance(Locale("ru", "RU"))
        return format.format(price) + " ₸"
    }

    companion object {
        const val REQUEST_EDIT_PROFILE = 1001
    }
}

// ========== DATA MODELS ==========

data class EngineerProfile(
    val id: String = "",
    val fullName: String = "",
    val phone: String = "",
    val email: String = "",
    val city: String = "",
    val isCompany: Boolean = false,
    val companyName: String = "",
    val specializations: List<String> = emptyList(),
    val experience: Int = 0,
    val hourlyRate: Int = 0,
    val description: String = "",
    val projectsCompleted: Int = 0,
    val rating: Float = 0f,
    val isComplete: Boolean = false
)

data class EngineerRequest(
    val id: String,
    val category: String,
    val objectName: String,
    val objectAddress: String,
    val customerName: String,
    val customerPhone: String,
    val customerEmail: String,
    val requirements: String,
    val totalPrice: Long,
    val status: String,
    val createdAt: Date,
    val deadline: Date?,
    val solutions: List<EngineerSolution> = emptyList(),
    val attachments: List<EngineerAttachment> = emptyList()
)

data class EngineerProject(
    val id: String,
    val category: String,
    val objectName: String,
    val objectAddress: String,
    val customerName: String,
    val customerPhone: String,
    val customerEmail: String,
    val totalPrice: Long,
    val status: String,
    val progress: Int,
    val createdAt: Date,
    val assignedAt: Date?,
    val submittedAt: Date?,
    val files: List<EngineerFile> = emptyList(),
    val comments: List<EngineerComment> = emptyList()
)

data class EngineerSolution(
    val id: String,
    val name: String,
    val description: String,
    val price: Long,
    val icon: String
)

data class EngineerAttachment(
    val name: String,
    val url: String
)

data class EngineerFile(
    val name: String,
    val type: String,
    val size: String,
    val url: String
)

data class EngineerComment(
    val author: String,
    val text: String,
    val createdAt: Date
)

data class EngineerSummary(
    val totalProjects: Int,
    val inWork: Int,
    val completed: Int,
    val rating: Float
)

data class Specialization(
    val id: String,
    val name: String,
    val icon: String,
    val description: String
)

// ========== DATA MANAGER ==========

object EngineerDataManager {
    private const val PREFS_NAME = "engineer_data"

    fun getProfile(context: Context): EngineerProfile {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return EngineerProfile(
            id = prefs.getString("profile_id", "") ?: "",
            fullName = prefs.getString("profile_name", "") ?: "",
            phone = prefs.getString("profile_phone", "") ?: "",
            email = prefs.getString("profile_email", "") ?: "",
            city = prefs.getString("profile_city", "") ?: "",
            isCompany = prefs.getBoolean("profile_is_company", false),
            companyName = prefs.getString("profile_company", "") ?: "",
            specializations = prefs.getStringSet("profile_specs", emptySet())?.toList() ?: emptyList(),
            experience = prefs.getInt("profile_experience", 0),
            hourlyRate = prefs.getInt("profile_rate", 0),
            description = prefs.getString("profile_desc", "") ?: "",
            projectsCompleted = prefs.getInt("profile_projects", 0),
            rating = prefs.getFloat("profile_rating", 0f),
            isComplete = prefs.getString("profile_name", "")?.isNotEmpty() == true &&
                    prefs.getString("profile_phone", "")?.isNotEmpty() == true &&
                    prefs.getStringSet("profile_specs", emptySet())?.isNotEmpty() == true
        )
    }

    fun saveProfile(context: Context, profile: EngineerProfile) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit().apply {
            putString("profile_id", profile.id)
            putString("profile_name", profile.fullName)
            putString("profile_phone", profile.phone)
            putString("profile_email", profile.email)
            putString("profile_city", profile.city)
            putBoolean("profile_is_company", profile.isCompany)
            putString("profile_company", profile.companyName)
            putStringSet("profile_specs", profile.specializations.toSet())
            putInt("profile_experience", profile.experience)
            putInt("profile_rate", profile.hourlyRate)
            putString("profile_desc", profile.description)
        }.apply()
    }

    fun getSummary(context: Context): EngineerSummary {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val projects = getMyProjects(context)
        return EngineerSummary(
            totalProjects = projects.size,
            inWork = projects.count { it.status == "IN_WORK" },
            completed = projects.count { it.status == "CLOSED" },
            rating = prefs.getFloat("profile_rating", 4.5f)
        )
    }

    fun getAvailableRequests(context: Context): List<EngineerRequest> {
        // Demo data
        return listOf(
            EngineerRequest(
                id = "eng-001",
                category = "DESIGN",
                objectName = "Жилой комплекс \"Астана Парк\"",
                objectAddress = "г. Астана, ул. Сарыарка 15",
                customerName = "ТОО \"СтройИнвест\"",
                customerPhone = "+7 701 234 5678",
                customerEmail = "info@stroyinvest.kz",
                requirements = "Разработка архитектурного проекта 16-этажного жилого комплекса.",
                totalPrice = 2500000,
                status = "PENDING",
                createdAt = Date(System.currentTimeMillis() - 2 * 24 * 60 * 60 * 1000),
                deadline = Date(System.currentTimeMillis() + 30 * 24 * 60 * 60 * 1000),
                solutions = listOf(
                    EngineerSolution("1", "Архитектурный проект", "АР", 1500000, "🏛️"),
                    EngineerSolution("2", "Конструктив", "КЖ", 800000, "🏗️")
                )
            ),
            EngineerRequest(
                id = "eng-002",
                category = "CALCULATION",
                objectName = "Торговый центр \"Мега\"",
                objectAddress = "г. Алматы, пр. Достык 111",
                customerName = "АО \"Ритейл Групп\"",
                customerPhone = "+7 702 555 1234",
                customerEmail = "tender@retailgroup.kz",
                requirements = "Расчёт несущих конструкций для реконструкции.",
                totalPrice = 850000,
                status = "PENDING",
                createdAt = Date(System.currentTimeMillis() - 5 * 24 * 60 * 60 * 1000),
                deadline = Date(System.currentTimeMillis() + 14 * 24 * 60 * 60 * 1000)
            ),
            EngineerRequest(
                id = "eng-003",
                category = "DOCUMENTATION",
                objectName = "Частный дом",
                objectAddress = "г. Караганда, пос. Жана-Арка",
                customerName = "Иванов Пётр Сергеевич",
                customerPhone = "+7 705 111 2233",
                customerEmail = "petr.ivanov@mail.ru",
                requirements = "Эскизный проект индивидуального жилого дома 250 м².",
                totalPrice = 350000,
                status = "PENDING",
                createdAt = Date(System.currentTimeMillis() - 1 * 24 * 60 * 60 * 1000),
                deadline = Date(System.currentTimeMillis() + 21 * 24 * 60 * 60 * 1000)
            )
        )
    }

    fun getMyProjects(context: Context): List<EngineerProject> {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val projectIds = prefs.getStringSet("my_projects", emptySet()) ?: emptySet()

        if (projectIds.isEmpty()) {
            // Demo data
            return listOf(
                EngineerProject(
                    id = "proj-001",
                    category = "DESIGN",
                    objectName = "Офисное здание \"БизнесЦентр\"",
                    objectAddress = "г. Астана, ул. Кабанбай Батыра 42",
                    customerName = "ТОО \"Офис Плюс\"",
                    customerPhone = "+7 701 888 9999",
                    customerEmail = "office@officeplus.kz",
                    totalPrice = 1200000,
                    status = "IN_WORK",
                    progress = 45,
                    createdAt = Date(System.currentTimeMillis() - 10 * 24 * 60 * 60 * 1000),
                    assignedAt = Date(System.currentTimeMillis() - 8 * 24 * 60 * 60 * 1000),
                    submittedAt = null,
                    files = listOf(
                        EngineerFile("ТЗ_офис.pdf", "pdf", "2.5 МБ", ""),
                        EngineerFile("Планировка.dwg", "dwg", "15.2 МБ", "")
                    ),
                    comments = listOf(
                        EngineerComment("Заказчик", "Учтите открытую планировку", Date())
                    )
                ),
                EngineerProject(
                    id = "proj-002",
                    category = "CALCULATION",
                    objectName = "Складской комплекс",
                    objectAddress = "г. Алматы, ИП \"Логистик\"",
                    customerName = "ТОО \"Логистик Казахстан\"",
                    customerPhone = "+7 727 333 4455",
                    customerEmail = "project@logistic.kz",
                    totalPrice = 650000,
                    status = "ON_REVIEW",
                    progress = 85,
                    createdAt = Date(System.currentTimeMillis() - 20 * 24 * 60 * 60 * 1000),
                    assignedAt = Date(System.currentTimeMillis() - 18 * 24 * 60 * 60 * 1000),
                    submittedAt = Date(System.currentTimeMillis() - 2 * 24 * 60 * 60 * 1000)
                )
            )
        }

        return emptyList()
    }

    fun acceptRequest(context: Context, requestId: String) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val projects = prefs.getStringSet("my_projects", mutableSetOf())?.toMutableSet() ?: mutableSetOf()
        projects.add(requestId)
        prefs.edit().putStringSet("my_projects", projects).apply()
    }

    fun submitProject(context: Context, projectId: String) {
        // Mark project as submitted
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString("project_${projectId}_status", "ON_REVIEW").apply()
    }

    fun getSpecializationLabel(spec: String): String {
        return when (spec) {
            "architecture" -> "🏛️ Архитектура"
            "structural" -> "🏗️ Конструктив"
            "mep" -> "⚙️ Инженерные системы"
            "electrical" -> "⚡ Электрика"
            "hvac" -> "❄️ ОВиК"
            "plumbing" -> "🚿 ВК"
            "fire_safety" -> "🔥 Пожарная безопасность"
            "geotechnical" -> "🌍 Геотехника"
            "surveying" -> "📐 Геодезия"
            "estimation" -> "📊 Сметное дело"
            "project_management" -> "📋 Управление проектами"
            else -> spec
        }
    }

    fun getAllSpecializations(): List<Specialization> {
        return listOf(
            Specialization("architecture", "Архитектура", "🏛️", "Архитектурные решения, планировки, фасады"),
            Specialization("structural", "Конструктив (ПГС)", "🏗️", "Расчёт конструкций, фундаментов"),
            Specialization("mep", "Инженерные системы", "⚙️", "Комплексные инженерные системы"),
            Specialization("electrical", "Электрика", "⚡", "Электроснабжение, освещение"),
            Specialization("hvac", "ОВиК", "❄️", "Отопление, вентиляция"),
            Specialization("plumbing", "ВК", "🚿", "Водоснабжение, канализация"),
            Specialization("fire_safety", "Пожарная безопасность", "🔥", "Пожаротушение, сигнализация"),
            Specialization("geotechnical", "Геотехника", "🌍", "Геологические изыскания"),
            Specialization("surveying", "Геодезия", "📐", "Топосъёмка, разбивка осей"),
            Specialization("estimation", "Сметное дело", "📊", "КС-2, КС-3"),
            Specialization("project_management", "Управление проектами", "📋", "Координация, контроль")
        )
    }
}

// ========== ADAPTERS ==========

class RequestPreviewAdapter(
    private val requests: List<EngineerRequest>,
    private val onClick: (EngineerRequest) -> Unit
) : RecyclerView.Adapter<RequestPreviewAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val category: TextView = view.findViewById(R.id.requestCategory)
        val title: TextView = view.findViewById(R.id.requestTitle)
        val price: TextView = view.findViewById(R.id.requestPrice)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_request_preview, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val request = requests[position]
        holder.category.text = getCategoryLabel(request.category)
        holder.title.text = request.objectName
        holder.price.text = formatPrice(request.totalPrice)
        holder.itemView.setOnClickListener { onClick(request) }
    }

    override fun getItemCount() = requests.size

    private fun getCategoryLabel(category: String): String {
        return when (category) {
            "DESIGN" -> "🎨 Дизайн-проект"
            "DOCUMENTATION" -> "📄 Документация"
            "CALCULATION" -> "🔢 Расчёты"
            else -> category
        }
    }

    private fun formatPrice(price: Long): String {
        val format = NumberFormat.getInstance(Locale("ru", "RU"))
        return format.format(price) + " ₸"
    }
}

class RequestsAdapter(
    private val requests: List<EngineerRequest>,
    private val onClick: (EngineerRequest) -> Unit,
    private val onTake: (EngineerRequest) -> Unit
) : RecyclerView.Adapter<RequestsAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val category: TextView = view.findViewById(R.id.requestCategory)
        val date: TextView = view.findViewById(R.id.requestDate)
        val title: TextView = view.findViewById(R.id.requestTitle)
        val address: TextView = view.findViewById(R.id.requestAddress)
        val price: TextView = view.findViewById(R.id.requestPrice)
        val takeButton: Button = view.findViewById(R.id.takeButton)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_request, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val request = requests[position]
        holder.category.text = getCategoryLabel(request.category)
        holder.date.text = formatDate(request.createdAt)
        holder.title.text = request.objectName
        holder.address.text = request.objectAddress
        holder.price.text = formatPrice(request.totalPrice)
        holder.itemView.setOnClickListener { onClick(request) }
        holder.takeButton.setOnClickListener { onTake(request) }
    }

    override fun getItemCount() = requests.size

    private fun getCategoryLabel(category: String): String {
        return when (category) {
            "DESIGN" -> "🎨 Дизайн"
            "DOCUMENTATION" -> "📄 Документация"
            "CALCULATION" -> "🔢 Расчёты"
            else -> category
        }
    }

    private fun formatPrice(price: Long): String {
        val format = NumberFormat.getInstance(Locale("ru", "RU"))
        return format.format(price) + " ₸"
    }

    private fun formatDate(date: Date): String {
        return SimpleDateFormat("dd.MM.yyyy", Locale.getDefault()).format(date)
    }
}

class ProjectsAdapter(
    private val projects: List<EngineerProject>,
    private val onClick: (EngineerProject) -> Unit,
    private val onSubmit: (EngineerProject) -> Unit
) : RecyclerView.Adapter<ProjectsAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val title: TextView = view.findViewById(R.id.projectTitle)
        val status: TextView = view.findViewById(R.id.projectStatus)
        val address: TextView = view.findViewById(R.id.projectAddress)
        val progress: ProgressBar = view.findViewById(R.id.projectProgress)
        val progressText: TextView = view.findViewById(R.id.projectProgressText)
        val price: TextView = view.findViewById(R.id.projectPrice)
        val submitButton: Button = view.findViewById(R.id.submitButton)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_project, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val project = projects[position]
        holder.title.text = project.objectName
        holder.status.text = getStatusLabel(project.status)
        holder.address.text = project.objectAddress
        holder.progress.progress = project.progress
        holder.progressText.text = "${project.progress}%"
        holder.price.text = formatPrice(project.totalPrice)
        holder.itemView.setOnClickListener { onClick(project) }

        if (project.status == "IN_WORK") {
            holder.submitButton.visibility = View.VISIBLE
            holder.submitButton.setOnClickListener { onSubmit(project) }
        } else {
            holder.submitButton.visibility = View.GONE
        }
    }

    override fun getItemCount() = projects.size

    private fun getStatusLabel(status: String): String {
        return when (status) {
            "IN_WORK" -> "🔧 В работе"
            "ON_REVIEW" -> "👁️ На проверке"
            "REVISION" -> "🔄 На доработке"
            "CLOSED" -> "✅ Завершён"
            else -> status
        }
    }

    private fun formatPrice(price: Long): String {
        val format = NumberFormat.getInstance(Locale("ru", "RU"))
        return format.format(price) + " ₸"
    }
}

// Placeholder for FlexboxLayout (would need to add dependency)
class FlexboxLayout(context: Context) : LinearLayout(context) {
    init {
        orientation = HORIZONTAL
    }
}
