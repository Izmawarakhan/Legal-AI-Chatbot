import os
import time
from dotenv import load_dotenv
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import matplotlib.pyplot as plt
from tabulate import tabulate

from utils import (
    get_vector_store,
    get_conversation_chain,
    LAW_CATEGORIES
)

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class ChatbotEvaluator:
    def __init__(self):
        print("⚖️ Initializing QanoonAI Pro-Evaluator (V4 with Rate-Limit Protection)...")
        self.vector_store = get_vector_store()
        
        self.test_cases = [
            {"query": "Rules for second marriage under Muslim Family Laws?", "true_category": "Family Law"},
            {"query": "Minimum age for marriage in Pakistan?", "true_category": "Family Law"},
            {"query": "Procedure for arrest under CrPC?", "true_category": "Criminal Law"},
            {"query": "Punishment for hurt caused by weapon under PPC?", "true_category": "Criminal Law"},
            {"query": "Working hour limits under Factories Act?", "true_category": "Labour Laws"},
            {"query": "Rules for maternity leave in Punjab?", "true_category": "Labour Laws"},
            {"query": "Property transfer under Transfer of Property Act?", "true_category": "Land & Property Laws"},
            {"query": "Role of Patwari in land registration?", "true_category": "Land & Property Laws"},
            {"query": "Direct and indirect tax in Pakistan?", "true_category": "Excise Taxation Laws"},
            {"query": "Rights against medical negligence?", "true_category": "Health & Medical Laws"}
        ]

    def run_evaluation(self):
        y_true = []
        y_pred = []
        
        print(f"\n| {'Question':<45} | {'Expected':<15} | {'Detected':<15} |")
        print("-" * 85)

        chain = get_conversation_chain(self.vector_store, GROQ_API_KEY, "General")

        for i, case in enumerate(self.test_cases):
            try:
                # 🛑 RATE LIMIT PROTECTION: Har sawal ke baad 10 seconds ka gap
                if i > 0:
                    print(f"...Waiting 10s for API cooldown...")
                    time.sleep(10)

                eval_query = case['query'] + " (Identify the specific law category in exactly two words at the very end of your response)"
                
                response = chain.invoke({"question": eval_query, "chat_history": []})
                full_answer = response['answer'].lower()
                
                # Strict Matching Logic (Category names matched first)
                detected_cat = "Unknown"
                mapping = {
                    "Family Law": ["family law"],
                    "Criminal Law": ["criminal law", "ppc", "crpc"],
                    "Labour Laws": ["labour law", "factories act"],
                    "Land & Property Laws": ["land and property", "property law"],
                    "Excise Taxation Laws": ["taxation law", "fbr", "excise"],
                    "Health & Medical Laws": ["medical law", "health law"]
                }

                for cat, keywords in mapping.items():
                    if any(k in full_answer for k in keywords):
                        detected_cat = cat
                        break
                
                y_true.append(case['true_category'])
                y_pred.append(detected_cat)
                
                status = "✅" if detected_cat == case['true_category'] else "❌"
                print(f"| {case['query'][:43]:<45} | {case['true_category']:<15} | {detected_cat:<15} | {status}")

            except Exception as e:
                if "429" in str(e):
                    print("\n🛑 RATE LIMIT HIT! API block ho gayi hai. 15 mins baad dobara run karein.")
                    break
                print(f"Error on case {i}: {e}")

        if len(y_pred) > 0:
            self.calculate_metrics(y_true, y_pred)

    def calculate_metrics(self, y_true, y_pred):
        acc = accuracy_score(y_true, y_pred)
        prec = precision_score(y_true, y_pred, average='weighted', zero_division=0)
        rec = recall_score(y_true, y_pred, average='weighted', zero_division=0)
        f1 = f1_score(y_true, y_pred, average='weighted', zero_division=0)

        metrics_data = [
            ["Accuracy", f"{acc*100:.2f}%"],
            ["Precision", f"{prec*100:.2f}%"],
            ["Recall", f"{rec*100:.2f}%"],
            ["F1 Score", f"{f1*100:.2f}%"]
        ]
        
        print("\n" + "="*45)
        print("         QanoonAI FINAL PERFORMANCE REPORT")
        print("="*45)
        print(tabulate(metrics_data, headers=["Metric", "Value"], tablefmt="fancy_grid"))
        self.plot_results(acc, prec, rec, f1)

    def plot_results(self, acc, prec, rec, f1):
        names = ['Accuracy', 'Precision', 'Recall', 'F1']
        values = [acc, prec, rec, f1]
        plt.figure(figsize=(10, 6))
        colors = ['#2980b9', '#f39c12', '#27ae60', '#c0392b']
        plt.bar(names, values, color=colors)
        plt.ylim(0, 1.1)
        plt.title("Final System Performance Dashboard")
        plt.savefig("final_fyp_report.png")
        print("\n📊 Final Report Saved: 'final_fyp_report.png'")

if __name__ == "__main__":
    evaluator = ChatbotEvaluator()
    evaluator.run_evaluation()