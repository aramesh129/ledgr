#!/usr/bin/env python3
"""
Flask server to expose the AI insights service
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from llm_service import FinancialInsightsAI

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize the AI service
ai_service = FinancialInsightsAI()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "AI Insights"})

@app.route('/generate-insights', methods=['POST'])
def generate_insights():
    """Generate financial insights using Llama 3.2 3B"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Generate insights using the AI service
        insights = ai_service.generate_insights(data)
        
        return jsonify({
            "success": True,
            "insights": insights
        })
        
    except Exception as e:
        print(f"Error generating insights: {e}", file=sys.stderr)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/generate-investment-insights', methods=['POST'])
def generate_investment_insights():
    """Generate investment insights using Llama 3.2 3B"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Extract investment data
        portfolio_summary = data.get('portfolioSummary', {})
        investments = data.get('investments', [])
        
        # Create financial data structure for the AI
        financial_data = {
            'totalIncome': portfolio_summary.get('totalValue', 0),
            'totalSpending': 0,  # Not applicable for investments
            'netFlow': portfolio_summary.get('totalGainLoss', 0),
            'currentBalance': portfolio_summary.get('totalValue', 0),
            'spendingByCategory': [],  # Not applicable for investments
            'topMerchants': [],  # Not applicable for investments
            'goals': [],  # Could be added later
            'monthlyTrend': [],  # Could be added later
            'investments': investments,
            'portfolioSummary': portfolio_summary
        }
        
        # Generate insights using the AI service
        insights = ai_service.generate_investment_insights(financial_data)
        
        return jsonify({
            "success": True,
            "insights": insights
        })
        
    except Exception as e:
        print(f"Error generating investment insights: {e}", file=sys.stderr)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    print("Starting AI Insights Server...")
    print("Make sure Ollama is running with llama3.2:3b model")
    app.run(host='0.0.0.0', port=5001, debug=True)