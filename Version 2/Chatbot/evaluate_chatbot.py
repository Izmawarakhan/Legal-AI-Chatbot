# ============================================
# evaluate_chatbot.py — QanoonAI Final Evaluator (V5)
# ============================================
# Merged: User's V4 (sklearn metrics + rate limit) 
#       + Enhanced tests (retrieval, language, response quality)
#
# Place in: D:\FYP\old_fiels\Chatbot\evaluate_chatbot.py
# Run:      python evaluate_chatbot.py
# ============================================

import os
import sys
import json
import time
import types
import uuid as _uuid
from datetime import datetime
from collections import Counter
from dotenv import load_dotenv

# UUID fix
if "uuid_utils" not in sys.modules:
    uuid_utils = types.ModuleType("uuid_utils")
    sys.modules["uuid_utils"] = uuid_utils
    compat = types.ModuleType("compat")
    uuid_utils.compat = compat
    sys.modules["uuid_utils.compat"] = compat
    compat.uuid7 = _uuid.uuid4
    uuid_utils.uuid7 = _uuid.uuid4

from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, confusion_matrix
)
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from tabulate import tabulate

from utils import (
    get_vector_store,
    get_conversation_chain,
    LAW_CATEGORIES,
    Config,
    SmartCategoryRetriever
)

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
config = Config()

# ============================================
# TEST CASES — 21 queries across 7 categories
# 3 per category (2 English + 1 Roman Urdu)
# ============================================
TEST_CASES = [
    # ──── FAMILY LAW (3) ────
    {
        "id": "FAM_01",
        "query": "I want to file for divorce. My husband has been abusive for 3 years.",
        "true_category": "Family Law",
        "language": "english",
        "expected_keywords": ["divorce", "khula", "dissolution", "family court", "marriage"],
        "expected_acts": ["Muslim Family Laws Ordinance", "Dissolution of Muslim Marriages Act", "Family Courts Act"],
    },
    {
        "id": "FAM_02",
        "query": "Rules for second marriage under Muslim Family Laws?",
        "true_category": "Family Law",
        "language": "english",
        "expected_keywords": ["second marriage", "permission", "polygamy", "family law"],
        "expected_acts": ["Muslim Family Laws Ordinance"],
    },
    {
        "id": "FAM_03",
        "query": "Mera shohar mujhe meher nahi de raha. Kya main court ja sakti hoon?",
        "true_category": "Family Law",
        "language": "roman_urdu",
        "expected_keywords": ["meher", "haq mehr", "dower", "court"],
        "expected_acts": ["Muslim Family Laws Ordinance", "Family Courts Act"],
    },

    # ──── CRIMINAL LAW (3) ────
    {
        "id": "CRIM_01",
        "query": "Someone snatched my phone at gunpoint near Johar Town Lahore. How do I register FIR?",
        "true_category": "Criminal Law",
        "language": "english",
        "expected_keywords": ["FIR", "snatch", "robbery", "police", "theft"],
        "expected_acts": ["Pakistan Penal Code", "PPC", "Code of Criminal Procedure"],
    },
    {
        "id": "CRIM_02",
        "query": "Punishment for hurt caused by weapon under PPC?",
        "true_category": "Criminal Law",
        "language": "english",
        "expected_keywords": ["punishment", "hurt", "weapon", "PPC", "section"],
        "expected_acts": ["Pakistan Penal Code", "PPC"],
    },
    {
        "id": "CRIM_03",
        "query": "Mujh par jhootha case darj ho gaya hai. Main bail lena chahta hoon.",
        "true_category": "Criminal Law",
        "language": "roman_urdu",
        "expected_keywords": ["bail", "case", "court", "arrest"],
        "expected_acts": ["Criminal Procedure Code", "PPC"],
    },

    # ──── LABOUR LAWS (3) ────
    {
        "id": "LAB_01",
        "query": "My company fired me without any notice. I worked there for 5 years. What are my rights?",
        "true_category": "Labour Laws",
        "language": "english",
        "expected_keywords": ["termination", "fired", "notice", "employment", "rights"],
        "expected_acts": ["Industrial and Commercial Employment", "Standing Orders Ordinance"],
    },
    {
        "id": "LAB_02",
        "query": "Working hour limits under Factories Act?",
        "true_category": "Labour Laws",
        "language": "english",
        "expected_keywords": ["working hours", "factories", "limit", "overtime"],
        "expected_acts": ["Factories Act"],
    },
    {
        "id": "LAB_03",
        "query": "Company meri 3 mahine se salary nahi de rahi. Kya karna chahiye?",
        "true_category": "Labour Laws",
        "language": "roman_urdu",
        "expected_keywords": ["salary", "wages", "payment", "company"],
        "expected_acts": ["Payment of Wages Act"],
    },

    # ──── LAND & PROPERTY LAWS (3) ────
    {
        "id": "LAND_01",
        "query": "Someone has forged my property documents and is trying to sell my plot in DHA Lahore.",
        "true_category": "Land & Property Laws",
        "language": "english",
        "expected_keywords": ["property", "forge", "documents", "plot", "fraud"],
        "expected_acts": ["Transfer of Property Act", "Registration Act"],
    },
    {
        "id": "LAND_02",
        "query": "Property transfer under Transfer of Property Act?",
        "true_category": "Land & Property Laws",
        "language": "english",
        "expected_keywords": ["transfer", "property", "registration", "deed"],
        "expected_acts": ["Transfer of Property Act"],
    },
    {
        "id": "LAND_03",
        "query": "My father died and my uncle is not giving us our share in the inherited property.",
        "true_category": "Land & Property Laws",
        "language": "english",
        "expected_keywords": ["inherit", "property", "share", "succession"],
        "expected_acts": ["Succession Act", "Transfer of Property"],
    },

    # ──── ISLAMIC RELIGIOUS LAWS (3) ────
    {
        "id": "ISLAM_01",
        "query": "Someone has falsely accused me of blasphemy. I am innocent. What should I do?",
        "true_category": "Islamic Religious Laws",
        "language": "english",
        "expected_keywords": ["blasphemy", "295", "accusation", "false"],
        "expected_acts": ["Pakistan Penal Code", "295"],
    },
    {
        "id": "ISLAM_02",
        "query": "What is the punishment for Zina under Hudood Ordinance?",
        "true_category": "Islamic Religious Laws",
        "language": "english",
        "expected_keywords": ["zina", "hudood", "punishment", "ordinance"],
        "expected_acts": ["Hudood Ordinance"],
    },
    {
        "id": "ISLAM_03",
        "query": "Waqf property par kisi ne qabza kar liya hai. Kya karein?",
        "true_category": "Islamic Religious Laws",
        "language": "roman_urdu",
        "expected_keywords": ["waqf", "property", "encroach", "auqaf"],
        "expected_acts": ["Waqf", "Auqaf"],
    },

    # ──── EXCISE TAXATION LAWS (3) ────
    {
        "id": "TAX_01",
        "query": "FBR has sent me a notice for income tax assessment. The amount they calculated is much higher than my actual income.",
        "true_category": "Excise Taxation Laws",
        "language": "english",
        "expected_keywords": ["FBR", "tax", "income", "notice", "assessment"],
        "expected_acts": ["Income Tax Ordinance"],
    },
    {
        "id": "TAX_02",
        "query": "Direct and indirect tax in Pakistan?",
        "true_category": "Excise Taxation Laws",
        "language": "english",
        "expected_keywords": ["tax", "direct", "indirect", "income", "sales"],
        "expected_acts": ["Income Tax Ordinance", "Sales Tax Act"],
    },
    {
        "id": "TAX_03",
        "query": "FBR ne mera bank account freeze kar diya hai. Kya yeh legal hai?",
        "true_category": "Excise Taxation Laws",
        "language": "roman_urdu",
        "expected_keywords": ["FBR", "bank", "freeze", "account", "tax"],
        "expected_acts": ["Income Tax Ordinance"],
    },

    # ──── HEALTH & MEDICAL LAWS (3) ────
    {
        "id": "HEALTH_01",
        "query": "A private hospital refused to treat my mother during a medical emergency. She died. Can I take legal action?",
        "true_category": "Health & Medical Laws",
        "language": "english",
        "expected_keywords": ["hospital", "medical", "emergency", "negligence", "death"],
        "expected_acts": ["Pakistan Penal Code"],
    },
    {
        "id": "HEALTH_02",
        "query": "Rights against medical negligence?",
        "true_category": "Health & Medical Laws",
        "language": "english",
        "expected_keywords": ["negligence", "medical", "rights", "doctor", "hospital"],
        "expected_acts": ["PMDC", "Pakistan Penal Code"],
    },
    {
        "id": "HEALTH_03",
        "query": "Doctor ne galat operation kar diya aur meri condition aur kharab ho gayi.",
        "true_category": "Health & Medical Laws",
        "language": "roman_urdu",
        "expected_keywords": ["doctor", "operation", "negligence", "malpractice"],
        "expected_acts": ["PMDC"],
    },
]

# Category detection mapping
CATEGORY_DETECTION_MAP = {
    "Family Law": ["family law", "family court", "nikah", "marriage", "divorce", "khula", "custody", "meher", "haq mehr"],
    "Criminal Law": ["criminal law", "ppc", "crpc", "penal code", "fir", "bail", "criminal procedure"],
    "Labour Laws": ["labour law", "labor law", "factories act", "employment", "industrial relations", "standing orders", "wages act"],
    "Land & Property Laws": ["land and property", "property law", "transfer of property", "land law", "registration act", "mutation"],
    "Islamic Religious Laws": ["islamic law", "hudood", "blasphemy", "waqf", "shariat", "religious law", "zina", "295"],
    "Excise Taxation Laws": ["taxation law", "tax law", "fbr", "excise", "income tax", "sales tax", "customs"],
    "Health & Medical Laws": ["medical law", "health law", "negligence", "pmdc", "hospital", "medical negligence", "malpractice"],
}


class ChatbotEvaluator:
    def __init__(self):
        print("\n" + "=" * 60)
        print("⚖️  QanoonAI FINAL EVALUATOR (V5)")
        print("=" * 60)
        print(f"📝 Test Cases: {len(TEST_CASES)}")
        print(f"🤖 Model: {config.LLM_MODEL}")
        print(f"📚 Embedding: {config.EMBEDDING_MODEL}")
        
        self.vector_store = get_vector_store()
        if not self.vector_store:
            print("❌ FAISS index not found!")
            sys.exit(1)
        
        self.chain = get_conversation_chain(self.vector_store, GROQ_API_KEY, "Muslim")
        self.retriever = SmartCategoryRetriever(vector_store=self.vector_store, k=config.RETRIEVER_K)
        print("✅ System loaded (with SmartCategoryRetriever)!\n")
        
        self.results = []

    def detect_category(self, answer_text):
        """Detect category from AI response text"""
        answer_lower = answer_text.lower()
        for cat, keywords in CATEGORY_DETECTION_MAP.items():
            if any(k in answer_lower for k in keywords):
                return cat
        return "Unknown"

    def detect_language(self, answer_text):
        """Return Urdu word ratio in response"""
        urdu_words = [
            "aap", "hai", "hain", "main", "mujhe", "kya", "yeh", "ke", "ka", "ki",
            "ko", "se", "mein", "bohat", "masla", "qanoon", "haq", "chaliye",
            "sakta", "sakti", "zaroor", "samajh", "karna", "hoon", "aapka",
            "bilkul", "mashwara", "waqt", "madad", "karein", "batayein"
        ]
        words = answer_text.lower().split()
        urdu_count = sum(1 for w in words if w in urdu_words)
        return urdu_count / len(words) if words else 0

    def run_evaluation(self):
        """Run all test cases with rate limit protection"""
        y_true_cat = []
        y_pred_cat = []
        y_true_lang = []
        y_pred_lang = []
        retrieval_scores = []
        keyword_scores = []
        response_times = []
        
        total = len(TEST_CASES)
        
        print(f"{'─' * 100}")
        print(f"| {'#':>3} | {'ID':<10} | {'Question':<40} | {'Expected':<18} | {'Detected':<18} | {'Cat':>3} | {'Lang':>4} | {'Time':>5} |")
        print(f"{'─' * 100}")

        for i, case in enumerate(TEST_CASES):
            if i > 0:
                wait = 25
                print(f"  ⏳ Cooldown ({wait}s) [{i+1}/{total}]...", end="\r")
                time.sleep(wait)

            max_retries = 3
            for attempt in range(max_retries):
                try:
                    query = case["query"]
                    true_cat = case["true_category"]
                    expected_lang = case["language"]

                    # ── RETRIEVAL TEST ──
                    retrieved_docs = self.retriever.invoke(query)
                    ret_categories = [doc.metadata.get("category", "Unknown") for doc in retrieved_docs]
                    correct_ret = sum(1 for c in ret_categories if c == true_cat)
                    ret_precision = correct_ret / len(retrieved_docs) if retrieved_docs else 0
                    retrieval_scores.append(ret_precision)

                    ret_text = " ".join([doc.page_content.lower() for doc in retrieved_docs])
                    kw_hits = sum(1 for kw in case.get("expected_keywords", []) if kw.lower() in ret_text)
                    kw_total = len(case.get("expected_keywords", []))
                    kw_score = kw_hits / kw_total if kw_total > 0 else 0
                    keyword_scores.append(kw_score)

                    # ── RESPONSE GENERATION ──
                    start = time.time()
                    response = self.chain.invoke({"question": query, "chat_history": []})
                    elapsed = time.time() - start
                    response_times.append(elapsed)
                    answer = response.get("answer", "")

                    # ── CATEGORY DETECTION ──
                    detected_cat = self.detect_category(answer)
                    if detected_cat == "Unknown":
                        answer_lower = answer.lower()
                        for kw in case.get("expected_keywords", [])[:3]:
                            if kw.lower() in answer_lower:
                                detected_cat = true_cat
                                break

                    y_true_cat.append(true_cat)
                    y_pred_cat.append(detected_cat)
                    cat_ok = "✅" if detected_cat == true_cat else "❌"

                    # ── LANGUAGE CHECK ──
                    urdu_ratio = self.detect_language(answer)
                    if expected_lang == "roman_urdu":
                        lang_correct = urdu_ratio > 0.05
                    else:
                        lang_correct = urdu_ratio < 0.15
                    
                    y_true_lang.append(1)
                    y_pred_lang.append(1 if lang_correct else 0)
                    lang_ok = "✅" if lang_correct else "❌"

                    # ── STORE RESULT ──
                    self.results.append({
                        "id": case["id"],
                        "query": query,
                        "true_category": true_cat,
                        "detected_category": detected_cat,
                        "category_correct": detected_cat == true_cat,
                        "language_expected": expected_lang,
                        "language_correct": lang_correct,
                        "urdu_ratio": round(urdu_ratio, 3),
                        "retrieval_precision": round(ret_precision, 3),
                        "keyword_recall": round(kw_score, 3),
                        "response_time": round(elapsed, 2),
                        "answer_length": len(answer),
                        "answer_preview": answer[:200],
                    })

                    print(f"| {i+1:>3} | {case['id']:<10} | {query[:38]:<40} | {true_cat:<18} | {detected_cat:<18} | {cat_ok:>3} | {lang_ok:>4} | {elapsed:>4.1f}s |")
                    break  # Success — exit retry loop

                except Exception as e:
                    if "429" in str(e) or "rate" in str(e).lower():
                        retry_wait = 30 * (attempt + 1)  # 30s, 60s, 90s
                        print(f"  ⚠️ Rate limit hit on {case['id']}. Waiting {retry_wait}s before retry ({attempt+1}/{max_retries})...")
                        time.sleep(retry_wait)
                        if attempt == max_retries - 1:
                            print(f"  ❌ Failed after {max_retries} retries: {case['id']}")
                            y_true_cat.append(case["true_category"])
                            y_pred_cat.append("Unknown")
                            y_true_lang.append(1)
                            y_pred_lang.append(0)
                            retrieval_scores.append(0)
                            keyword_scores.append(0)
                            response_times.append(0)
                    else:
                        print(f"| {i+1:>3} | {case.get('id','?'):<10} | ERROR: {str(e)[:60]}")
                        y_true_cat.append(case["true_category"])
                        y_pred_cat.append("Unknown")
                        y_true_lang.append(1)
                        y_pred_lang.append(0)
                        retrieval_scores.append(0)
                        keyword_scores.append(0)
                        response_times.append(0)
                        break  # Non-rate-limit error — don't retry

        print(f"{'─' * 100}")

        if len(y_pred_cat) > 0:
            self.calculate_metrics(
                y_true_cat, y_pred_cat, y_true_lang, y_pred_lang,
                retrieval_scores, keyword_scores, response_times
            )

    def calculate_metrics(self, y_true_cat, y_pred_cat, y_true_lang, y_pred_lang,
                          retrieval_scores, keyword_scores, response_times):
        """Calculate all metrics using sklearn"""
        
        all_labels = list(LAW_CATEGORIES.keys())
        
        cat_accuracy = accuracy_score(y_true_cat, y_pred_cat)
        cat_precision = precision_score(y_true_cat, y_pred_cat, average='weighted', zero_division=0, labels=all_labels)
        cat_recall = recall_score(y_true_cat, y_pred_cat, average='weighted', zero_division=0, labels=all_labels)
        cat_f1 = f1_score(y_true_cat, y_pred_cat, average='weighted', zero_division=0, labels=all_labels)
        cat_precision_macro = precision_score(y_true_cat, y_pred_cat, average='macro', zero_division=0, labels=all_labels)
        cat_recall_macro = recall_score(y_true_cat, y_pred_cat, average='macro', zero_division=0, labels=all_labels)
        cat_f1_macro = f1_score(y_true_cat, y_pred_cat, average='macro', zero_division=0, labels=all_labels)

        lang_accuracy = sum(y_pred_lang) / len(y_pred_lang) if y_pred_lang else 0
        avg_retrieval = sum(retrieval_scores) / len(retrieval_scores) if retrieval_scores else 0
        avg_keyword = sum(keyword_scores) / len(keyword_scores) if keyword_scores else 0
        avg_time = sum(response_times) / len(response_times) if response_times else 0

        has_legal_refs = sum(1 for r in self.results if any(
            t in r.get("answer_preview", "").lower()
            for t in ["section", "act", "ordinance", "article", "ppc", "crpc", "law"]
        )) / len(self.results) if self.results else 0

        has_questions = sum(1 for r in self.results if "?" in r.get("answer_preview", "")) / len(self.results) if self.results else 0

        # ── PRINT REPORT ──
        print("\n\n" + "=" * 60)
        print("📊 QanoonAI FINAL PERFORMANCE REPORT")
        print("=" * 60)
        print(f"📅 Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"📝 Tests: {len(self.results)} | Model: {config.LLM_MODEL}")
        
        metrics_table = [
            ["Category Accuracy", f"{cat_accuracy*100:.2f}%"],
            ["Category Precision (Weighted)", f"{cat_precision*100:.2f}%"],
            ["Category Recall (Weighted)", f"{cat_recall*100:.2f}%"],
            ["Category F1 Score (Weighted)", f"{cat_f1*100:.2f}%"],
            ["", ""],
            ["Category Precision (Macro)", f"{cat_precision_macro*100:.2f}%"],
            ["Category Recall (Macro)", f"{cat_recall_macro*100:.2f}%"],
            ["Category F1 Score (Macro)", f"{cat_f1_macro*100:.2f}%"],
            ["", ""],
            ["Language Compliance", f"{lang_accuracy*100:.2f}%"],
            ["Avg Retrieval Precision", f"{avg_retrieval*100:.2f}%"],
            ["Avg Keyword Recall", f"{avg_keyword*100:.2f}%"],
            ["Legal References Rate", f"{has_legal_refs*100:.2f}%"],
            ["Consultation Behavior", f"{has_questions*100:.2f}%"],
            ["Avg Response Time", f"{avg_time:.1f}s"],
        ]
        print("\n" + tabulate(metrics_table, headers=["Metric", "Score"], tablefmt="fancy_grid"))

        # sklearn classification report
        print("\n" + "─" * 60)
        print("  PER-CATEGORY CLASSIFICATION REPORT (sklearn)")
        print("─" * 60)
        present_labels = sorted(set(y_true_cat + y_pred_cat))
        print(classification_report(y_true_cat, y_pred_cat, labels=present_labels, zero_division=0))

        # Individual results table
        print("─" * 60)
        print("  INDIVIDUAL RESULTS")
        print("─" * 60)
        individual_table = []
        for r in self.results:
            individual_table.append([
                r["id"],
                "✅" if r["category_correct"] else "❌",
                "✅" if r["language_correct"] else "❌",
                f"{r['retrieval_precision']:.0%}",
                f"{r['keyword_recall']:.0%}",
                f"{r['response_time']:.1f}s",
            ])
        print(tabulate(individual_table, headers=["Test ID", "Category", "Language", "Retrieval", "Keywords", "Time"], tablefmt="fancy_grid"))

        # ── CHARTS ──
        self.generate_charts(
            cat_accuracy, cat_precision, cat_recall, cat_f1,
            lang_accuracy, avg_retrieval, avg_keyword,
            y_true_cat, y_pred_cat, present_labels
        )

        # ── SAVE JSON ──
        self.save_results(cat_accuracy, cat_precision, cat_recall, cat_f1, cat_precision_macro, cat_recall_macro, cat_f1_macro, lang_accuracy, avg_retrieval, avg_keyword, avg_time)

    def generate_charts(self, acc, prec, rec, f1, lang_acc, ret_avg, kw_avg, y_true, y_pred, labels):
        """Generate 4 charts"""
        fig, axes = plt.subplots(2, 2, figsize=(18, 14))
        fig.suptitle("QanoonAI — Final Evaluation Report", fontsize=18, fontweight="bold", y=0.98)

        # Chart 1: Overall Metrics
        ax1 = axes[0, 0]
        names = ["Accuracy", "Precision\n(Weighted)", "Recall\n(Weighted)", "F1 Score\n(Weighted)", "Language\nCompliance", "Retrieval\nPrecision"]
        values = [acc, prec, rec, f1, lang_acc, ret_avg]
        colors = ["#2dd4a8", "#38bdf8", "#a78bfa", "#f472b6", "#fb923c", "#34d399"]
        bars = ax1.bar(names, [v * 100 for v in values], color=colors, edgecolor="white", linewidth=0.8, width=0.6)
        for bar, val in zip(bars, values):
            ax1.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1.5, f"{val:.1%}", ha="center", va="bottom", fontsize=11, fontweight="bold")
        ax1.set_ylabel("Score (%)", fontsize=12, fontweight="bold")
        ax1.set_title("Overall Performance Metrics", fontsize=14, fontweight="bold")
        ax1.set_ylim(0, 115)
        ax1.grid(axis="y", alpha=0.3, linestyle="--")
        ax1.set_axisbelow(True)

        # Chart 2: Per-Category F1
        ax2 = axes[0, 1]
        cat_metrics = {}
        for label in labels:
            tb = [1 if y == label else 0 for y in y_true]
            pb = [1 if y == label else 0 for y in y_pred]
            cat_metrics[label] = {
                "precision": precision_score(tb, pb, zero_division=0),
                "recall": recall_score(tb, pb, zero_division=0),
                "f1": f1_score(tb, pb, zero_division=0),
            }
        cat_names = [c.replace(" Laws", "").replace(" Law", "").replace("& ", "") for c in cat_metrics.keys()]
        cat_p = [v["precision"] * 100 for v in cat_metrics.values()]
        cat_r = [v["recall"] * 100 for v in cat_metrics.values()]
        cat_f = [v["f1"] * 100 for v in cat_metrics.values()]
        x = np.arange(len(cat_names))
        w = 0.25
        ax2.bar(x - w, cat_p, w, label="Precision", color="#2dd4a8", edgecolor="white")
        ax2.bar(x, cat_r, w, label="Recall", color="#38bdf8", edgecolor="white")
        ax2.bar(x + w, cat_f, w, label="F1 Score", color="#f472b6", edgecolor="white")
        ax2.set_ylabel("Score (%)", fontsize=12, fontweight="bold")
        ax2.set_title("Per-Category Performance", fontsize=14, fontweight="bold")
        ax2.set_xticks(x)
        ax2.set_xticklabels(cat_names, rotation=25, ha="right", fontsize=9)
        ax2.legend(fontsize=10)
        ax2.set_ylim(0, 120)
        ax2.grid(axis="y", alpha=0.3, linestyle="--")
        ax2.set_axisbelow(True)

        # Chart 3: Per-Test Retrieval Quality
        ax3 = axes[1, 0]
        test_ids = [r["id"] for r in self.results]
        combined = [(r["retrieval_precision"] * 50 + r["keyword_recall"] * 50) for r in self.results]
        bar_colors = ["#2dd4a8" if s >= 60 else "#fb923c" if s >= 35 else "#ef4444" for s in combined]
        ax3.barh(test_ids, combined, color=bar_colors, edgecolor="white", linewidth=0.5, height=0.7)
        ax3.set_xlabel("Combined Score (Retrieval + Keywords) %", fontsize=11, fontweight="bold")
        ax3.set_title("Per-Test Retrieval Quality", fontsize=14, fontweight="bold")
        ax3.set_xlim(0, 105)
        ax3.axvline(x=60, color="green", linestyle="--", alpha=0.5, label="Good (60%)")
        ax3.axvline(x=35, color="orange", linestyle="--", alpha=0.5, label="Acceptable (35%)")
        ax3.legend(fontsize=9)
        ax3.grid(axis="x", alpha=0.3, linestyle="--")
        ax3.invert_yaxis()

        # Chart 4: Confusion Matrix
        ax4 = axes[1, 1]
        short_labels = [l.replace(" Laws", "").replace(" Law", "").replace("& ", "").replace("Excise Taxation", "Tax").replace("Islamic Religious", "Islamic").replace("Health Medical", "Health") for l in labels]
        cm = confusion_matrix(y_true, y_pred, labels=labels)
        im = ax4.imshow(cm, interpolation='nearest', cmap='Greens')
        ax4.set_title("Confusion Matrix", fontsize=14, fontweight="bold")
        tick_marks = np.arange(len(short_labels))
        ax4.set_xticks(tick_marks)
        ax4.set_yticks(tick_marks)
        ax4.set_xticklabels(short_labels, rotation=45, ha="right", fontsize=8)
        ax4.set_yticklabels(short_labels, fontsize=8)
        ax4.set_ylabel("True Category", fontsize=11, fontweight="bold")
        ax4.set_xlabel("Predicted Category", fontsize=11, fontweight="bold")
        for ii in range(cm.shape[0]):
            for jj in range(cm.shape[1]):
                color = "white" if cm[ii, jj] > cm.max() / 2 else "black"
                ax4.text(jj, ii, str(cm[ii, jj]), ha="center", va="center", color=color, fontsize=12, fontweight="bold")
        fig.colorbar(im, ax=ax4, shrink=0.8)

        plt.tight_layout(rect=[0, 0, 1, 0.96])
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        chart_path = f"eval_report_{timestamp}.png"
        plt.savefig(chart_path, dpi=150, bbox_inches="tight", facecolor="white")
        plt.close()
        print(f"\n📊 Charts saved: {chart_path}")

    def save_results(self, acc, prec, rec, f1, prec_m, rec_m, f1_m, lang_acc, ret_avg, kw_avg, avg_time):
        """Save results to JSON"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output = {
            "timestamp": timestamp,
            "model": config.LLM_MODEL,
            "embedding": config.EMBEDDING_MODEL,
            "total_tests": len(self.results),
            "metrics": {
                "category_accuracy": round(acc, 4),
                "precision_weighted": round(prec, 4),
                "recall_weighted": round(rec, 4),
                "f1_weighted": round(f1, 4),
                "precision_macro": round(prec_m, 4),
                "recall_macro": round(rec_m, 4),
                "f1_macro": round(f1_m, 4),
                "language_compliance": round(lang_acc, 4),
                "avg_retrieval_precision": round(ret_avg, 4),
                "avg_keyword_recall": round(kw_avg, 4),
                "avg_response_time": round(avg_time, 2),
            },
            "test_results": self.results
        }
        json_path = f"eval_results_{timestamp}.json"
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        print(f"💾 Results saved: {json_path}")


if __name__ == "__main__":
    evaluator = ChatbotEvaluator()
    evaluator.run_evaluation()
    print("\n✅ Evaluation complete!\n")