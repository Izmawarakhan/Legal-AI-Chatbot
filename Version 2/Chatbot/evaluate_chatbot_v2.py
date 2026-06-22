# ============================================
# evaluate_chatbot_v2.py — QanoonAI Evaluation Suite
# ============================================
import os
import sys
import json
import time
from datetime import datetime
from collections import defaultdict
from dotenv import load_dotenv

# Machine Learning Metrics
try:
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
    import matplotlib.pyplot as plt
    from tabulate import tabulate
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

# Import existing chatbot logic
from utils import (
    get_vector_store,
    get_conversation_chain,
    LAW_CATEGORIES,
    Config
)

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class ChatbotEvaluator:
    def __init__(self):
        print("🚀 Initializing QanoonAI Evaluation Suite...")
        self.vector_store = get_vector_store()
        self.results = []
        
        # Test Dataset (Aap ismein aur sawal add kar sakti hain)
        self.test_cases = [
            {"query": "How can I apply for divorce in Pakistan?", "true_category": "Family Law"},
            {"query": "What is the punishment for theft in PPC?", "true_category": "Criminal Law"},
            {"query": "What are the requirements for a valid Nikkah?", "true_category": "Family Law"},
            {"query": "How to register a police FIR?", "true_category": "Criminal Law"},
            {"query": "Inheritance rights of a widow?", "true_category": "Family Law"}
        ]

    def run_evaluation(self):
        y_true = []
        y_pred = []
        
        print(f"\n| {'Question':<45} | {'True Category':<15} | {'Predicted':<15} |")
        print("-" * 80)

        for case in self.test_cases:
            # Get model response
            chain = get_conversation_chain(self.vector_store, GROQ_API_KEY, "General")
            response = chain({"question": case['query'], "chat_history": []})
            
            full_answer = response['answer']
            
            # Predict category based on model output content
            predicted_cat = "Unknown"
            for cat in LAW_CATEGORIES.keys():
                if cat.lower() in full_answer.lower():
                    predicted_cat = cat
            
            y_true.append(case['true_category'])
            y_pred.append(predicted_cat)
            
            print(f"| {case['query'][:43]:<45} | {case['true_category']:<15} | {predicted_cat:<15} |")

        if SKLEARN_AVAILABLE:
            self.calculate_metrics(y_true, y_pred)
        else:
            print("\n⚠️ Please install sklearn: pip install scikit-learn")

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
        
        print("\n" + "="*40)
        print("         FINAL PERFORMANCE METRICS")
        print("="*40)
        print(tabulate(metrics_data, headers=["Metric", "Value"], tablefmt="fancy_grid"))
        
        # Save Chart
        self.plot_results(acc, prec, rec, f1)

    def plot_results(self, acc, prec, rec, f1):
        names = ['Accuracy', 'Precision', 'Recall', 'F1']
        values = [acc, prec, rec, f1]
        plt.figure(figsize=(8, 5))
        plt.bar(names, values, color=['skyblue', 'orange', 'green', 'red'])
        plt.ylim(0, 1.1)
        plt.ylabel("Score")
        plt.title("QanoonAI Backend Evaluation")
        plt.savefig("evaluation_metrics.png")
        print("\n📊 Dashboard saved as 'evaluation_metrics.png'")

if __name__ == "__main__":
    evaluator = ChatbotEvaluator()
    evaluator.run_evaluation()