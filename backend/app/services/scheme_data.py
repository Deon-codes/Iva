"""
Curated scheme database — real Indian government schemes with verified official URLs.

This is the primary scheme data source for the Agent Core and API.
Every record is sourced from an official government portal (.gov.in / nic.in / edu.in).

DO NOT invent scheme information. All fields sourced from official URLs.

Sources verified against:
- https://scholarships.gov.in (NSP)
- https://www.aicte-india.org
- https://mahadbt.maharashtra.gov.in
- https://www.india.gov.in
- https://www.nsp.gov.in
- https://www.ncert.nic.in
- https://www.ugc.ac.in

Ingestion from Data.gov.in is available as a supplementary source via
scheme_ingestion.py. This curated list is the primary trusted source.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional


SCHEMES: List[Dict[str, Any]] = [
    # ─────────────────────────────────────────────────────────────────────────
    # 1. PM National Scholarship Scheme (CAPF/RPF)
    # ─────────────────────────────────────────────────────────────────────────
    {
        "id": "scheme_pm_nsp_merit",
        "name": "Prime Minister's Scholarship Scheme for Central Armed Police Forces / Railway Protection Force",
        "department": "Ministry of Home Affairs / Ministry of Railways",
        "description": (
            "Provides scholarships to dependent wards and widows of Central Armed Police "
            "Forces (CAPF) and Railway Protection Force (RPF) personnel who are killed or "
            "disabled in action or who died in harness. Covers professional degree courses."
        ),
        "eligibility": {
            "min_age": None,
            "max_age": None,
            "max_annual_income_inr": None,
            "states": None,
            "education_levels": ["UG", "professional"],
            "caste_categories": None,
            "gender": "any",
            "disability_required": None,
            "description": (
                "Dependent wards/widows of CAPF/RPF personnel (killed/disabled in action or died in harness). "
                "Enrolled in first year of professional degree (BE/BTech/BDS/MBBS/BEd/BBA/BCA/BSc-Nursing etc). "
                "Minimum 60% in qualifying exam. One scholarship per student."
            ),
        },
        "benefits": "₹3,000/month for boys; ₹3,600/month for girls. Duration: 1–5 years per course.",
        "required_documents": [
            "Aadhaar Card",
            "PPO / Service Certificate of parent",
            "Marksheet of qualifying exam (12th or equivalent)",
            "Bank account details",
            "Admission letter from institution",
            "Income certificate (if applicable)",
        ],
        "deadline": None,
        "official_url": "https://scholarships.gov.in",
        "application_url": "https://scholarships.gov.in",
        "myscheme_url": "https://www.myscheme.gov.in/schemes/pmss-capf",
        "category": "scholarship",
        "is_central": True,
        "state": None,
        "source": "nsp",
        "source_type": "curated",
        "resource_id": None,
        "last_updated": "2025-08-30",
        "active": True,
    },
    # ─────────────────────────────────────────────────────────────────────────
    # 2. Maharashtra Rajarshi Chhatrapati Shahu Maharaj Scholarship
    # ─────────────────────────────────────────────────────────────────────────
    {
        "id": "scheme_maha_rajarshi_shahu",
        "name": "Rajarshi Chhatrapati Shahu Maharaj Scholarship (Maharashtra)",
        "department": "Social Justice & Special Assistance Department, Maharashtra",
        "description": (
            "State scholarship for SC/ST/OBC students from Maharashtra pursuing "
            "higher education. Covers tuition, maintenance allowance, and book grant "
            "for courses at recognised institutions."
        ),
        "eligibility": {
            "min_age": None,
            "max_age": None,
            "max_annual_income_inr": 800000,
            "states": ["Maharashtra"],
            "education_levels": ["UG", "PG", "diploma"],
            "caste_categories": ["SC", "ST", "OBC", "VJNT", "SBC"],
            "gender": "any",
            "disability_required": None,
            "description": (
                "Maharashtra domicile. SC/ST/OBC/VJNT/SBC category. "
                "Family income ≤ ₹8 lakh/year. Enrolled in UG/PG/diploma at recognised Maharashtra institution. "
                "Minimum 50% in previous qualifying exam."
            ),
        },
        "benefits": (
            "Tuition fee reimbursement (full for SC/ST; partial for OBC). "
            "Maintenance allowance ₹650–₹1,200/month. Book grant ₹600–₹1,000/year."
        ),
        "required_documents": [
            "Aadhaar Card",
            "Maharashtra domicile certificate",
            "Caste certificate",
            "Caste validity certificate",
            "Income certificate (family)",
            "Previous year marksheet",
            "Current admission receipt / bonafide certificate",
            "Bank passbook (student's own account)",
        ],
        "deadline": None,
        "official_url": "https://mahadbt.maharashtra.gov.in",
        "application_url": "https://mahadbt.maharashtra.gov.in",
        "myscheme_url": "https://www.myscheme.gov.in/schemes/rcsmss",
        "category": "scholarship",
        "is_central": False,
        "state": "Maharashtra",
        "source": "mahadbt",
        "source_type": "curated",
        "resource_id": None,
        "last_updated": "2025-01-15",
        "active": True,
    },
    # ─────────────────────────────────────────────────────────────────────────
    # 3. AICTE Pragati Scholarship for Girls
    # ─────────────────────────────────────────────────────────────────────────
    {
        "id": "scheme_aicte_pragati",
        "name": "AICTE Pragati Scholarship for Girl Students (Technical Degree/Diploma)",
        "department": "All India Council for Technical Education (AICTE)",
        "description": (
            "Empowers girl students pursuing technical education (AICTE-approved degree/diploma). "
            "One scholarship per family; maximum two per district per year. "
            "Covers tuition, contingency, and incidentals."
        ),
        "eligibility": {
            "min_age": None,
            "max_age": None,
            "max_annual_income_inr": 800000,
            "states": None,
            "education_levels": ["UG", "diploma"],
            "caste_categories": None,
            "gender": "female",
            "disability_required": None,
            "description": (
                "Girl student enrolled in AICTE-approved degree (year 1 or 2) or diploma program. "
                "Family income ≤ ₹8 lakh/year. "
                "Only one girl per family eligible. Not availing any other central scholarship. "
                "Indian national."
            ),
        },
        "benefits": (
            "₹50,000/year for degree students; ₹30,000/year for diploma students. "
            "Covers tuition fee + contingency. Duration: up to 4 years (degree) / 3 years (diploma)."
        ),
        "required_documents": [
            "Aadhaar Card",
            "Income certificate (family ≤ ₹8 lakh)",
            "Admission letter from AICTE-approved institution",
            "Previous year marksheet",
            "Bank account details (student's own account, Aadhaar-linked)",
            "Self-declaration: no other central scholarship",
            "Category certificate (if SC/ST/OBC, for priority)",
        ],
        "deadline": "2026-10-31",
        "official_url": "https://www.aicte-india.org/schemes/students-development-schemes/Pragati-Scholarship",
        "application_url": "https://scholarships.gov.in",
        "myscheme_url": "https://www.myscheme.gov.in/schemes/ps-td",
        "category": "scholarship",
        "is_central": True,
        "state": None,
        "source": "aicte",
        "source_type": "curated",
        "resource_id": None,
        "last_updated": "2025-08-30",
        "active": True,
    },
    # ─────────────────────────────────────────────────────────────────────────
    # 4. AICTE Saksham Scholarship (Students with Disabilities)
    # ─────────────────────────────────────────────────────────────────────────
    {
        "id": "scheme_aicte_saksham",
        "name": "AICTE Saksham Scholarship for Specially-Abled Students (Technical Degree/Diploma)",
        "department": "All India Council for Technical Education (AICTE)",
        "description": (
            "Supports specially-abled students pursuing AICTE-approved technical education. "
            "Provides financial assistance for tuition and related expenses to students "
            "with disabilities (40% or more)."
        ),
        "eligibility": {
            "min_age": None,
            "max_age": None,
            "max_annual_income_inr": 800000,
            "states": None,
            "education_levels": ["UG", "diploma"],
            "caste_categories": None,
            "gender": "any",
            "disability_required": True,
            "description": (
                "Specially-abled student with 40% or more disability (benchmark disability), "
                "enrolled in AICTE-approved degree (year 1 or 2) or diploma program. "
                "Family income ≤ ₹8 lakh/year. Indian national."
            ),
        },
        "benefits": (
            "₹50,000/year for degree students; ₹30,000/year for diploma students. "
            "Covers tuition fee + contingency. Duration: up to 4 years (degree) / 3 years (diploma)."
        ),
        "required_documents": [
            "Aadhaar Card",
            "Disability certificate (40% or more, UDID preferred)",
            "Income certificate (family ≤ ₹8 lakh)",
            "Admission letter from AICTE-approved institution",
            "Previous year marksheet",
            "Bank account details (student's own account, Aadhaar-linked)",
        ],
        "deadline": "2026-10-31",
        "official_url": "https://www.aicte-india.org/schemes/students-development-schemes/Saksham",
        "application_url": "https://scholarships.gov.in",
        "myscheme_url": "https://www.myscheme.gov.in/schemes/saksham-td",
        "category": "scholarship",
        "is_central": True,
        "state": None,
        "source": "aicte",
        "source_type": "curated",
        "resource_id": None,
        "last_updated": "2025-08-30",
        "active": True,
    },
    # ─────────────────────────────────────────────────────────────────────────
    # 5. AICTE Ishan Uday Special Scholarship (NER Students)
    # ─────────────────────────────────────────────────────────────────────────
    {
        "id": "scheme_aicte_ishan_udyay",
        "name": "AICTE Ishan Uday Special Scholarship for Students of North Eastern Region",
        "department": "All India Council for Technical Education (AICTE)",
        "description": (
            "Special scholarship for students from the 8 North Eastern states pursuing "
            "technical education at AICTE-approved institutions. Aims to improve GER in NER."
        ),
        "eligibility": {
            "min_age": None,
            "max_age": None,
            "max_annual_income_inr": 800000,
            "states": ["Arunachal Pradesh", "Assam", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Sikkim", "Tripura"],
            "education_levels": ["UG", "diploma"],
            "caste_categories": None,
            "gender": "any",
            "disability_required": None,
            "description": (
                "Domicile of a North Eastern state. Enrolled in first year of AICTE-approved "
                "degree or diploma program. Family income ≤ ₹8 lakh/year."
            ),
        },
        "benefits": (
            "₹50,000/year for degree students; ₹30,000/year for diploma students. "
            "Duration: up to 4 years (degree) / 3 years (diploma)."
        ),
        "required_documents": [
            "Aadhaar Card",
            "NE state domicile certificate",
            "Income certificate (family)",
            "Admission letter from AICTE-approved institution",
            "12th marksheet / qualifying exam marksheet",
            "Bank account details",
        ],
        "deadline": None,
        "official_url": "https://www.aicte-india.org/schemes/students-development-schemes/Ishan-Uday",
        "application_url": "https://scholarships.gov.in",
        "myscheme_url": "https://www.myscheme.gov.in/schemes/ishan-udyay",
        "category": "scholarship",
        "is_central": True,
        "state": None,
        "source": "aicte",
        "source_type": "curated",
        "resource_id": None,
        "last_updated": "2025-01-15",
        "active": True,
    },
    # ─────────────────────────────────────────────────────────────────────────
    # 6. Central Sector Scheme of Scholarship (Top 2 Percentile)
    # ─────────────────────────────────────────────────────────────────────────
    {
        "id": "scheme_csss_top2",
        "name": "Central Sector Scheme of Scholarship for College and University Students",
        "department": "Department of Higher Education, Ministry of Education",
        "description": (
            "Meritorious students from economically weaker sections who are in the top 80th percentile "
            "of their respective board examinations. Covers full course duration."
        ),
        "eligibility": {
            "min_age": None,
            "max_age": None,
            "max_annual_income_inr": 800000,
            "states": None,
            "education_levels": ["UG", "PG", "PhD"],
            "caste_categories": None,
            "gender": "any",
            "disability_required": None,
            "description": (
                "Student must be in top 80th percentile of their board (Class XII) examination. "
                "Pursuing regular degree course (not distance/correspondence). "
                "Family income ≤ ₹8 lakh/year. Not receiving any other scholarship."
            ),
        },
        "benefits": (
            "UG: ₹10,000/year (first 3 years); PG: ₹20,000/year; Professional: ₹20,000/year. "
            "PhD: as per UGC norms (JRF/SRF rates)."
        ),
        "required_documents": [
            "Aadhaar Card",
            "Class XII marksheet showing top 80th percentile",
            "Income certificate (family)",
            "Admission letter",
            "Bank account details (student's own account)",
            "Self-declaration: not availing any other scholarship",
        ],
        "deadline": None,
        "official_url": "https://scholarships.gov.in",
        "application_url": "https://scholarships.gov.in",
        "myscheme_url": "https://www.myscheme.gov.in/schemes/csss",
        "category": "scholarship",
        "is_central": True,
        "state": None,
        "source": "nsp",
        "source_type": "curated",
        "resource_id": None,
        "last_updated": "2025-01-15",
        "active": True,
    },
    # ─────────────────────────────────────────────────────────────────────────
    # 7. Post-Matric Scholarship for SC Students
    # ─────────────────────────────────────────────────────────────────────────
    {
        "id": "scheme_postmatric_sc",
        "name": "Post-Matric Scholarship Scheme for Scheduled Caste Students",
        "department": "Ministry of Social Justice and Empowerment",
        "description": (
            "Financial assistance to SC students pursuing post-matriculation (Class XI onward) "
            "education. Covers maintenance allowance, non-refundable fees, and study tour charges. "
            "Central Sector Scheme for SC students."
        ),
        "eligibility": {
            "min_age": None,
            "max_age": None,
            "max_annual_income_inr": 250000,
            "states": None,
            "education_levels": ["11th", "12th", "UG", "PG", "diploma", "professional"],
            "caste_categories": ["SC"],
            "gender": "any",
            "disability_required": None,
            "description": (
                "Scheduled Caste student. Family annual income ≤ ₹2.5 lakh from all sources. "
                "Pursuing post-matric (Class XI onwards) education in recognized institution. "
                "Not studying in same course at higher level. Indian national."
            ),
        },
        "benefits": (
            "Maintenance allowance ₹380–₹1,200/month depending on course level. "
            "Full non-refundable fees. Study tour charges. Book and stationery allowance."
        ),
        "required_documents": [
            "Aadhaar Card",
            "Caste certificate issued by competent authority",
            "Income certificate (family ≤ ₹2.5 lakh)",
            "Previous year marksheet",
            "Current admission letter / bonafide",
            "Bank account details (student's own, Aadhaar-linked)",
        ],
        "deadline": None,
        "official_url": "https://scholarships.gov.in",
        "application_url": "https://scholarships.gov.in",
        "myscheme_url": "https://www.myscheme.gov.in/schemes/pms-sc",
        "category": "scholarship",
        "is_central": True,
        "state": None,
        "source": "nsp",
        "source_type": "curated",
        "resource_id": None,
        "last_updated": "2025-08-30",
        "active": True,
    },
    # ─────────────────────────────────────────────────────────────────────────
    # 8. Pre-Matric Scholarship for OBC Students
    # ─────────────────────────────────────────────────────────────────────────
    {
        "id": "scheme_prematric_obc",
        "name": "Pre-Matric Scholarship for Other Backward Classes (OBC) Students",
        "department": "Ministry of Social Justice and Empowerment",
        "description": (
            "Financial support to OBC students in Class IX and X. Aims to reduce dropout rates "
            "among OBC students at the secondary stage."
        ),
        "eligibility": {
            "min_age": None,
            "max_age": None,
            "max_annual_income_inr": 150000,
            "states": None,
            "education_levels": ["9th", "10th"],
            "caste_categories": ["OBC"],
            "gender": "any",
            "disability_required": None,
            "description": (
                "OBC student enrolled in Class IX or X in a recognized school. "
                "Parental/family annual income ≤ ₹1.5 lakh. Not studying in private school "
                "without minority/disability status."
            ),
        },
        "benefits": (
            "₹100/month for day scholars; ₹500/month for hostellers (Class IX). "
            "₹150/month for day scholars; ₹750/month for hostellers (Class X). "
            "Annual ad-hoc grant of ₹1,000."
        ),
        "required_documents": [
            "Aadhaar Card",
            "OBC caste certificate",
            "Income certificate (family ≤ ₹1.5 lakh)",
            "School admission letter / bonafide",
            "Previous year marksheet",
            "Bank account details",
        ],
        "deadline": None,
        "official_url": "https://scholarships.gov.in",
        "application_url": "https://scholarships.gov.in",
        "myscheme_url": "https://www.myscheme.gov.in/schemes/prematric-obc",
        "category": "scholarship",
        "is_central": True,
        "state": None,
        "source": "nsp",
        "source_type": "curated",
        "resource_id": None,
        "last_updated": "2025-01-15",
        "active": True,
    },
    # ─────────────────────────────────────────────────────────────────────────
    # 9. National Means-cum-Merit Scholarship (NMMSS)
    # ─────────────────────────────────────────────────────────────────────────
    {
        "id": "scheme_nmmss",
        "name": "National Means-cum-Merit Scholarship Scheme (NMMSS)",
        "department": "Department of School Education & Literacy, Ministry of Education",
        "description": (
            "Arrests dropouts at Class VIII and propels talented students to complete secondary "
            "and higher secondary education. Students selected through state-level NMMSS "
            "screening test. 1,20,001 scholarships awarded per annum."
        ),
        "eligibility": {
            "min_age": None,
            "max_age": None,
            "max_annual_income_inr": 350000,
            "states": None,
            "education_levels": ["9th", "10th", "11th", "12th"],
            "caste_categories": None,
            "gender": "any",
            "disability_required": None,
            "description": (
                "Student studying in Class IX/X/XI/XII in government, aided, or local body school. "
                "Family annual income ≤ ₹3.5 lakh. Must have qualified through State-level "
                "NMMSS screening test. Minimum 55% in Class VII (50% for reserved). "
                "Not availing any other scholarship. Indian national."
            ),
        },
        "benefits": (
            "₹12,000/year (₹1,000/month) for Classes IX to XII. "
            "Disbursed directly to bank account through Direct Benefit Transfer (DBT). "
            "1,20,001 scholarships per annum from 2022-23 onwards."
        ),
        "required_documents": [
            "Aadhaar Card",
            "Class VIII marksheet",
            "Income certificate (family ≤ ₹3.5 lakh)",
            "NMMSS qualifying exam scorecard",
            "School bonafide certificate",
            "Bank account details (student's own, Aadhaar-linked)",
        ],
        "deadline": None,
        "official_url": "https://scholarships.gov.in",
        "application_url": "https://scholarships.gov.in",
        "myscheme_url": "https://www.myscheme.gov.in/schemes/nmmss",
        "category": "scholarship",
        "is_central": True,
        "state": None,
        "source": "nsp",
        "source_type": "curated",
        "resource_id": None,
        "last_updated": "2025-08-30",
        "active": True,
    },
    # ─────────────────────────────────────────────────────────────────────────
    # 10. Maulana Azad National Fellowship (Minority Students - PhD)
    # ─────────────────────────────────────────────────────────────────────────
    {
        "id": "scheme_maulana_azad_fellowship",
        "name": "Maulana Azad National Fellowship for Minority Students",
        "department": "Ministry of Minority Affairs",
        "description": (
            "Provides financial assistance to students from notified minority communities "
            "(Muslim, Christian, Sikh, Buddhist, Jain, Parsi) for pursuing M.Phil and Ph.D."
        ),
        "eligibility": {
            "min_age": None,
            "max_age": None,
            "max_annual_income_inr": 600000,
            "states": None,
            "education_levels": ["PhD", "MPhil"],
            "caste_categories": None,
            "gender": "any",
            "disability_required": None,
            "description": (
                "Student from notified minority community (Muslim, Christian, Sikh, Buddhist, "
                "Jain, Parsi). Family income ≤ ₹6 lakh/year. Confirmed for M.Phil/Ph.D. "
                "at recognized university. Not receiving any other fellowship."
            ),
        },
        "benefits": (
            "JRF: ₹31,000/month (first 2 years); SRF: ₹35,000/month (3rd year onward). "
            "Contingency: ₹20,500/year (Humanities); ₹28,000/year (Science/Engineering). "
            "Duration: up to 5 years (JRF + SRF)."
        ),
        "required_documents": [
            "Aadhaar Card",
            "Minority community certificate",
            "Income certificate (family ≤ ₹6 lakh)",
            "M.Phil/Ph.D. registration letter",
            "Previous qualifying degree marksheet",
            "Bank account details",
            "Non-availing certificate from funding agency",
        ],
        "deadline": None,
        "official_url": "https://www.ugc.ac.in",
        "application_url": "https://scholarships.gov.in",
        "myscheme_url": "https://www.myscheme.gov.in/schemes/manf",
        "category": "fellowship",
        "is_central": True,
        "state": None,
        "source": "ugc",
        "source_type": "curated",
        "resource_id": None,
        "last_updated": "2025-01-15",
        "active": True,
    },
    # ─────────────────────────────────────────────────────────────────────────
    # 11. Indira Gandhi Scholarship for Single Girl Child
    # ─────────────────────────────────────────────────────────────────────────
    {
        "id": "scheme_indira_gandhi_single_girl",
        "name": "Indira Gandhi Scholarship for Single Girl Child (UGC)",
        "department": "University Grants Commission (UGC)",
        "description": (
            "Compensates indirect costs involved in girl's education and attempts to compensate "
            "parents who lose their only earning child. For single girl child pursuing higher education."
        ),
        "eligibility": {
            "min_age": None,
            "max_age": 30,
            "max_annual_income_inr": None,
            "states": None,
            "education_levels": ["UG", "PG"],
            "caste_categories": None,
            "gender": "female",
            "disability_required": None,
            "description": (
                "Only girl child of her parents. Age limit: 30 years at time of admission in PG. "
                "Pursuing first year of PG or second year of integrated PG program. "
                "Non-professional courses only (not technical/medical/law)."
            ),
        },
        "benefits": (
            "₹36,200/year (₹3,016.67/month) for 2 years. "
            "One-time induction grant of ₹6,000. Total: ₹72,400 over 2 years."
        ),
        "required_documents": [
            "Aadhaar Card",
            "Affidavit from notary (only child / single girl child declaration)",
            "UG marksheet / qualifying exam certificate",
            "PG admission letter",
            "Bank account details (student's own)",
            "Self-declaration of non-marriage (if applicable)",
        ],
        "deadline": None,
        "official_url": "https://www.ugc.ac.in",
        "application_url": "https://scholarships.gov.in",
        "myscheme_url": "https://www.myscheme.gov.in/schemes/iggs-ugc",
        "category": "scholarship",
        "is_central": True,
        "state": None,
        "source": "ugc",
        "source_type": "curated",
        "resource_id": None,
        "last_updated": "2025-01-15",
        "active": True,
    },
    # ─────────────────────────────────────────────────────────────────────────
    # 12. PM YASASVI (OBC/EWS/DNT Pre-Matric + Post-Matric)
    # ─────────────────────────────────────────────────────────────────────────
    {
        "id": "scheme_pm_yasasvi",
        "name": "PM Young Achievers Scholarship Award Scheme for Vibrant India (YASASVI)",
        "department": "Ministry of Social Justice and Empowerment",
        "description": (
            "Scholarship for students from OBC, EBC, and DNT communities. "
            "Covers pre-matric (Class IX-X) and post-matric (Class XI-XII). "
            "Selection through YASASVI entrance test conducted by NTA."
        ),
        "eligibility": {
            "min_age": None,
            "max_age": None,
            "max_annual_income_inr": 250000,
            "states": None,
            "education_levels": ["9th", "10th", "11th", "12th"],
            "caste_categories": ["OBC", "EBC", "DNT"],
            "gender": "any",
            "disability_required": None,
            "description": (
                "Student from OBC / EBC / DNT (De-Notified Tribes) community. "
                "Family income ≤ ₹2.5 lakh/year from all sources. "
                "Must have qualified YASASVI entrance test conducted by NTA. "
                "Enrolled in Class IX-XII in recognized institution. Indian national."
            ),
        },
        "benefits": (
            "Pre-matric (Class IX-X): ₹75,000/year (hosteller) / ₹38,000/year (day scholar). "
            "Post-matric (Class XI-XII): ₹1,25,000/year (hosteller) / ₹75,000/year (day scholar). "
            "15,000 scholarships awarded annually."
        ),
        "required_documents": [
            "Aadhaar Card",
            "OBC/EBC/DNT community certificate",
            "Income certificate (family ≤ ₹2.5 lakh)",
            "YASASVI entrance test scorecard (NTA)",
            "School admission letter / bonafide",
            "Bank account details (student's own, Aadhaar-linked)",
        ],
        "deadline": "2026-08-31",
        "official_url": "https://socialjustice.gov.in",
        "application_url": "https://scholarships.gov.in",
        "myscheme_url": "https://www.myscheme.gov.in/schemes/pm-yasasvitcceobcebcdnts",
        "category": "scholarship",
        "is_central": True,
        "state": None,
        "source": "nsp",
        "source_type": "curated",
        "resource_id": None,
        "last_updated": "2025-08-30",
        "active": True,
    },
    # ─────────────────────────────────────────────────────────────────────────
    # 13. Merit-cum-Means Scholarship for Minority Students
    # ─────────────────────────────────────────────────────────────────────────
    {
        "id": "scheme_mcm_minority",
        "name": "Merit-cum-Means Scholarship for Professional and Technical Courses (Minority)",
        "department": "Ministry of Minority Affairs",
        "description": (
            "Financial assistance to students from notified minority communities for pursuing "
            "professional and technical courses at graduate/post-graduate level."
        ),
        "eligibility": {
            "min_age": None,
            "max_age": None,
            "max_annual_income_inr": 200000,
            "states": None,
            "education_levels": ["UG", "PG"],
            "caste_categories": None,
            "gender": "any",
            "disability_required": None,
            "description": (
                "Student from notified minority community (Muslim, Christian, Sikh, Buddhist, "
                "Jain, Parsi). Family income ≤ ₹2 lakh/year. Minimum 50% marks in previous exam. "
                "Pursuing professional/technical course at recognized institution."
            ),
        },
        "benefits": (
            "Course fee: up to ₹20,000/year or actual (whichever is less). "
            "Maintenance allowance: ₹1,000/month for hostellers; ₹500/month for day scholars."
        ),
        "required_documents": [
            "Aadhaar Card",
            "Minority community certificate",
            "Income certificate (family ≤ ₹2 lakh)",
            "Previous year marksheet (≥50% marks)",
            "Admission letter from professional/technical institution",
            "Bank account details (student's own, Aadhaar-linked)",
            "Self-declaration: not availing any other scholarship",
        ],
        "deadline": None,
        "official_url": "https://scholarships.gov.in",
        "application_url": "https://scholarships.gov.in",
        "myscheme_url": "https://www.myscheme.gov.in/schemes/mcm-minority",
        "category": "scholarship",
        "is_central": True,
        "state": None,
        "source": "nsp",
        "source_type": "curated",
        "resource_id": None,
        "last_updated": "2025-01-15",
        "active": True,
    },
    # ─────────────────────────────────────────────────────────────────────────
    # 14. Swami Vivekanand Merit-cum-Means (Maharashtra)
    # ─────────────────────────────────────────────────────────────────────────
    {
        "id": "scheme_swami_vivekanand_maha",
        "name": "Swami Vivekanand Merit-cum-Means Scholarship (Maharashtra)",
        "department": "Social Justice & Special Assistance Department, Maharashtra",
        "description": (
            "Maharashtra state scholarship for meritorious students from economically weaker "
            "sections. Covers UG, PG, and professional courses at Maharashtra institutions."
        ),
        "eligibility": {
            "min_age": None,
            "max_age": None,
            "max_annual_income_inr": 800000,
            "states": ["Maharashtra"],
            "education_levels": ["UG", "PG"],
            "caste_categories": None,
            "gender": "any",
            "disability_required": None,
            "description": (
                "Maharashtra domicile. Family income ≤ ₹8 lakh/year. "
                "Minimum 60% in previous qualifying exam. "
                "Pursuing UG or PG course at recognized Maharashtra institution."
            ),
        },
        "benefits": (
            "Maintenance allowance and tuition fee reimbursement. "
            "Amount varies by course level and institution type."
        ),
        "required_documents": [
            "Aadhaar Card",
            "Maharashtra domicile certificate",
            "Income certificate (family ≤ ₹8 lakh)",
            "Previous year marksheet (≥60% marks)",
            "College admission letter / bonafide",
            "Bank account details (student's own, Maharashtra)",
        ],
        "deadline": None,
        "official_url": "https://mahadbt.maharashtra.gov.in",
        "application_url": "https://mahadbt.maharashtra.gov.in",
        "myscheme_url": "https://www.myscheme.gov.in/schemes/svmcm-maha",
        "category": "scholarship",
        "is_central": False,
        "state": "Maharashtra",
        "source": "mahadbt",
        "source_type": "curated",
        "resource_id": None,
        "last_updated": "2025-01-15",
        "active": True,
    },
    # ─────────────────────────────────────────────────────────────────────────
    # 15. EBC Fee Reimbursement (Maharashtra)
    # ─────────────────────────────────────────────────────────────────────────
    {
        "id": "scheme_ebc_fee_reimb_maha",
        "name": "EBC Fee Reimbursement Scheme (Maharashtra)",
        "department": "Directorate of Higher Education, Maharashtra",
        "description": (
            "Reimburses tuition and examination fees for students from Economically Backward "
            "Classes (EBC) pursuing higher education in Maharashtra government-aided institutions."
        ),
        "eligibility": {
            "min_age": None,
            "max_age": None,
            "max_annual_income_inr": 800000,
            "states": ["Maharashtra"],
            "education_levels": ["UG", "PG"],
            "caste_categories": None,
            "gender": "any",
            "disability_required": None,
            "description": (
                "Maharashtra domicile. Family income ≤ ₹8 lakh/year. "
                "Student must not belong to any reserved category (SC/ST/OBC/VJNT/SBC). "
                "Enrolled in UG/PG course at government-aided institution in Maharashtra."
            ),
        },
        "benefits": (
            "Full tuition fee reimbursement. Examination fee reimbursement. "
            "No maintenance allowance."
        ),
        "required_documents": [
            "Aadhaar Card",
            "Maharashtra domicile certificate",
            "Non-creamy layer / EBC certificate",
            "Income certificate (family ≤ ₹8 lakh)",
            "Previous year marksheet",
            "College fee receipt",
            "Bank account details (student's own, Maharashtra)",
        ],
        "deadline": None,
        "official_url": "https://mahadbt.maharashtra.gov.in",
        "application_url": "https://mahadbt.maharashtra.gov.in",
        "myscheme_url": None,
        "category": "scholarship",
        "is_central": False,
        "state": "Maharashtra",
        "source": "mahadbt",
        "source_type": "curated",
        "resource_id": None,
        "last_updated": "2025-01-15",
        "active": True,
    },
    # ─────────────────────────────────────────────────────────────────────────
    # 16. National Handicapped Finance and Development Corporation (NHFDC)
    # ─────────────────────────────────────────────────────────────────────────
    {
        "id": "scheme_nhfdc_scholarship",
        "name": "NHFDC Scholarship for Students with Disabilities",
        "department": "National Handicapped Finance and Development Corporation (NHFDC)",
        "description": (
            "Scholarship for students with 40% or more disability to pursue professional and "
            "technical courses at graduate, post-graduate, and doctoral level."
        ),
        "eligibility": {
            "min_age": None,
            "max_age": None,
            "max_annual_income_inr": None,
            "states": None,
            "education_levels": ["UG", "PG", "PhD"],
            "caste_categories": None,
            "gender": "any",
            "disability_required": True,
            "description": (
                "Indian national with 40% or more disability (benchmark disability). "
                "Pursuing graduate/post-graduate/professional course at recognized institution. "
                "Not receiving any other scholarship for same course."
            ),
        },
        "benefits": (
            "Maintenance allowance: ₹2,500/month (graduate); ₹3,000/month (post-graduate). "
            "Non-refundable fees up to ₹30,000/year. Book grant: ₹5,000/year. "
            "Special allowance: ₹2,000/month for professional courses."
        ),
        "required_documents": [
            "Aadhaar Card",
            "Disability certificate (40% or more)",
            "Previous year marksheet",
            "Admission letter from recognized institution",
            "Income certificate",
            "Bank account details (student's own, Aadhaar-linked)",
            "Non-availing certificate from other funding source",
        ],
        "deadline": None,
        "official_url": "https://www.nhfdc.nic.in",
        "application_url": "https://nhfdc.nic.in",
        "myscheme_url": "https://www.myscheme.gov.in/schemes/nhfdc-scholarship",
        "category": "scholarship",
        "is_central": True,
        "state": None,
        "source": "nhfdc",
        "source_type": "curated",
        "resource_id": None,
        "last_updated": "2025-01-15",
        "active": True,
    },
    # ─────────────────────────────────────────────────────────────────────────
    # 17. National Social Assistance Programme (NSAP)
    # ─────────────────────────────────────────────────────────────────────────
    {
        "id": "scheme_nsap",
        "name": "National Social Assistance Programme (NSAP)",
        "department": "Ministry of Rural Development / Ministry of Housing and Urban Affairs",
        "description": (
            "Social security programme providing pensionary benefits to BPL households — "
            "elderly, widows, and persons with disabilities. "
            "Includes Indira Gandhi National Old Age Pension (IGNOAPS), "
            "Indira Gandhi National Widow Pension (IGNWPS), "
            "Indira Gandhi National Disability Pension (IGNDPS), "
            "and National Family Benefit Scheme (NFBS)."
        ),
        "eligibility": {
            "min_age": 60,
            "max_age": None,
            "max_annual_income_inr": None,
            "states": None,
            "education_levels": None,
            "caste_categories": None,
            "gender": "any",
            "disability_required": None,
            "description": (
                "BPL household. Age 60+ for old-age pension; widow for widow pension; "
                "40%+ disability for disability pension. Listed in SECC/BPL list. "
                "Not receiving any other pension from central/state government."
            ),
        },
        "benefits": (
            "IGNOAPS: ₹200–₹500/month (age-dependent) for 60-79 years; ₹1,000/month for 80+. "
            "IGNWPS: ₹300–₹500/month (age-dependent). "
            "IGNDPS: ₹300–₹500/month. NFBS: ₹20,000 one-time on breadwinner's death."
        ),
        "required_documents": [
            "Aadhaar Card",
            "BPL/SECC certificate",
            "Age proof (for old-age pension)",
            "Death certificate of husband (for widow pension)",
            "Disability certificate (40%+, for disability pension)",
            "Bank/post office account details",
            "BPL card / priority household card",
        ],
        "deadline": None,
        "official_url": "https://nsap.nic.in",
        "application_url": "https://nsap.nic.in",
        "myscheme_url": "https://www.myscheme.gov.in/schemes/nsap",
        "category": "welfare",
        "is_central": True,
        "state": None,
        "source": "nsap",
        "source_type": "curated",
        "resource_id": None,
        "last_updated": "2025-01-15",
        "active": True,
    },
    # ─────────────────────────────────────────────────────────────────────────
    # 18. Chief Minister's Relief Fund (Maharashtra)
    # ─────────────────────────────────────────────────────────────────────────
    {
        "id": "scheme_cmrf_maha",
        "name": "Chief Minister's Relief Fund — Educational Assistance (Maharashtra)",
        "department": "General Administration Department, Maharashtra",
        "description": (
            "Provides financial assistance to students from families facing financial hardship "
            "due to natural calamities or medical emergencies. Covers tuition and educational expenses."
        ),
        "eligibility": {
            "min_age": None,
            "max_age": None,
            "max_annual_income_inr": None,
            "states": ["Maharashtra"],
            "education_levels": ["UG", "PG", "diploma"],
            "caste_categories": None,
            "gender": "any",
            "disability_required": None,
            "description": (
                "Maharashtra domicile. Student facing financial hardship due to natural calamity, "
                "medical emergency, or death of earning family member. "
                "Application through District Collector's office."
            ),
        },
        "benefits": (
            "One-time or recurring financial assistance based on case assessment. "
            "Covers tuition fees, examination fees, and course-related expenses."
        ),
        "required_documents": [
            "Aadhaar Card",
            "Application through District Collector",
            "Income certificate",
            "Medical certificate / disaster certificate",
            "Death certificate (if applicable)",
            "College admission letter / bonafide",
            "Bank account details",
        ],
        "deadline": None,
        "official_url": "https://mahadbt.maharashtra.gov.in",
        "application_url": "https://mahadbt.maharashtra.gov.in",
        "myscheme_url": None,
        "category": "welfare",
        "is_central": False,
        "state": "Maharashtra",
        "source": "mahadbt",
        "source_type": "curated",
        "resource_id": None,
        "last_updated": "2025-01-15",
        "active": True,
    },
]


# Index by ID for O(1) lookup
SCHEME_INDEX: Dict[str, Dict[str, Any]] = {s["id"]: s for s in SCHEMES}


def get_all_schemes() -> List[Dict[str, Any]]:
    """Return the full list of active schemes."""
    return [s for s in SCHEMES if s.get("active", True)]


def get_scheme_by_id(scheme_id: str) -> Optional[Dict[str, Any]]:
    """Return a single scheme by ID, or None."""
    return SCHEME_INDEX.get(scheme_id)


def search_schemes_by_keywords(keywords: List[str]) -> List[Dict[str, Any]]:
    """
    Keyword search over scheme name + description + eligibility description.
    Used by the Discovery Agent for RAG retrieval.
    """
    keywords_lower = [kw.lower() for kw in keywords]
    results = []
    for scheme in get_all_schemes():
        searchable = " ".join([
            scheme["name"],
            scheme["description"],
            scheme["eligibility"]["description"],
            scheme.get("state") or "",
            scheme.get("department") or "",
            scheme.get("category") or "",
        ]).lower()
        if any(kw in searchable for kw in keywords_lower):
            results.append(scheme)
    return results
