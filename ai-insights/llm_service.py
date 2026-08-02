#!/usr/bin/env python3
"""
AI Insights Service using Ollama with Llama 3.2 3B
Generates personalized financial insights with humor and actionable advice
"""

import json
import requests
import sys
from typing import Dict, List, Any

class FinancialInsightsAI:
    def __init__(self, ollama_url: str = "http://localhost:11434"):
        self.ollama_url = ollama_url
        self.model = "llama3.2:3b"
    
    def generate_insights(self, financial_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate AI insights from financial data"""
        
        # Extract key metrics
        total_income = financial_data.get('totalIncome', 0)
        total_spending = financial_data.get('totalSpending', 0)
        net_flow = financial_data.get('netFlow', 0)
        current_balance = financial_data.get('currentBalance', 0)
        
        # Category breakdown
        spending_by_category = financial_data.get('spendingByCategory', [])
        top_categories = sorted(spending_by_category, key=lambda x: x.get('amount', 0), reverse=True)[:3]
        
        # Top merchants
        top_merchants = financial_data.get('topMerchants', [])[:3]
        
        # Goals data
        goals = financial_data.get('goals', [])
        active_goals = [g for g in goals if g.get('isActive', True)]
        
        # Monthly trend
        monthly_trend = financial_data.get('monthlyTrend', [])
        
        # Create the prompt
        prompt = self._create_prompt(
            total_income, total_spending, net_flow, current_balance,
            top_categories, top_merchants, active_goals, monthly_trend
        )
        
        # Generate insights using Ollama
        insights = self._call_ollama(prompt)
        
        return insights
    
    def generate_investment_insights(self, financial_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate AI insights for investment portfolio"""
        
        # Extract investment data
        investments = financial_data.get('investments', [])
        portfolio_summary = financial_data.get('portfolioSummary', {})
        
        # Calculate key metrics
        total_value = portfolio_summary.get('totalValue', 0)
        total_gain_loss = portfolio_summary.get('totalGainLoss', 0)
        total_gain_loss_percent = portfolio_summary.get('totalGainLossPercent', 0)
        day_change = portfolio_summary.get('dayChange', 0)
        investment_count = portfolio_summary.get('investmentCount', 0)
        
        # Find best and worst performers
        if investments:
            sorted_investments = sorted(investments, key=lambda x: x.get('totalGainLossPercent', 0), reverse=True)
            best_performer = sorted_investments[0]
            worst_performer = sorted_investments[-1]
        else:
            best_performer = None
            worst_performer = None
        
        # Create the investment prompt
        prompt = self._create_investment_prompt(
            total_value, total_gain_loss, total_gain_loss_percent, day_change,
            investment_count, investments, best_performer, worst_performer
        )
        
        # Generate insights using Ollama
        insights = self._call_ollama(prompt)
        
        return insights
    
    def _create_prompt(self, total_income: float, total_spending: float, net_flow: float, 
                      current_balance: float, top_categories: List[Dict], 
                      top_merchants: List[Dict], goals: List[Dict], 
                      monthly_trend: List[Dict]) -> str:
        """Create a detailed prompt for the LLM"""
        
        # Format category data
        category_text = ""
        for i, cat in enumerate(top_categories, 1):
            category_text += f"{i}. {cat.get('category', 'Unknown')}: ${cat.get('amount', 0):,.2f}\n"
        
        # Format merchant data
        merchant_text = ""
        for i, merchant in enumerate(top_merchants, 1):
            merchant_text += f"{i}. {merchant.get('merchant', 'Unknown')}: ${merchant.get('totalAmount', 0):,.2f} ({merchant.get('count', 0)} transactions)\n"
        
        # Format goals data
        goals_text = ""
        for goal in goals[:3]:  # Top 3 goals
            progress = (goal.get('currentAmount', 0) / goal.get('targetAmount', 1)) * 100
            goals_text += f"- {goal.get('title', 'Goal')}: ${goal.get('currentAmount', 0):,.2f}/${goal.get('targetAmount', 0):,.2f} ({progress:.1f}%)\n"
        
        # Monthly trend analysis
        trend_text = ""
        if len(monthly_trend) >= 2:
            recent = monthly_trend[-1].get('amount', 0)
            previous = monthly_trend[-2].get('amount', 0)
            change = ((recent - previous) / previous * 100) if previous > 0 else 0
            trend_text = f"Monthly spending change: {change:+.1f}% (${recent:,.2f} vs ${previous:,.2f})"
        
        prompt = f"""You are a fun, witty financial advisor for college students. Analyze this financial data and provide insights with humor and actionable advice.

FINANCIAL DATA:
- Total Income: ${total_income:,.2f}
- Total Spending: ${total_spending:,.2f}
- Net Flow: ${net_flow:,.2f}
- Current Balance: ${current_balance:,.2f}

TOP SPENDING CATEGORIES:
{category_text}

TOP MERCHANTS:
{merchant_text}

ACTIVE GOALS:
{goals_text}

TREND DATA:
{trend_text}

Please provide insights in this JSON format:
{{
  "spendingHighlights": {{
    "biggestExpense": "Funny comment about the biggest expense",
    "overspendingAlert": "Witty alert about overspending (if applicable)",
    "positiveReinforcement": "Encouraging message about good financial behavior"
  }},
  "categoryInsights": [
    {{
      "category": "Category name",
      "insight": "Humorous insight about this category",
      "suggestion": "Actionable tip to improve spending in this category"
    }}
  ],
  "predictions": [
    {{
      "type": "goal_timeline",
      "message": "Prediction about goal achievement timeline",
      "actionable": "Specific step to improve timeline"
    }}
  ],
  "funFacts": [
    "Humorous observation about spending patterns",
    "Light-hearted comparison or joke"
  ],
  "actionableRecommendations": [
    "Specific, realistic step 1",
    "Specific, realistic step 2",
    "Specific, realistic step 3"
  ]
}}

Keep it fun, relatable, and student-friendly. Use emojis sparingly. Make jokes about relatable college experiences. Be encouraging but honest about spending habits."""

        return prompt
    
    def _create_investment_prompt(self, total_value: float, total_gain_loss: float, 
                                 total_gain_loss_percent: float, day_change: float,
                                 investment_count: int, investments: List[Dict],
                                 best_performer: Dict, worst_performer: Dict) -> str:
        """Create a detailed prompt for investment analysis"""
        
        # Format investment data
        investment_text = ""
        for i, inv in enumerate(investments[:5], 1):  # Top 5 investments
            symbol = inv.get('symbol', 'Unknown')
            shares = inv.get('shares', 0)
            current_price = inv.get('currentPrice', 0)
            total_value_inv = inv.get('totalValue', 0)
            gain_loss = inv.get('totalGainLoss', 0)
            gain_loss_percent = inv.get('totalGainLossPercent', 0)
            day_change_percent = inv.get('dayChangePercent', 0)
            
            investment_text += f"{i}. {symbol}: {shares} shares @ ${current_price:.2f} = ${total_value_inv:,.2f} ({gain_loss_percent:+.1f}% total, {day_change_percent:+.1f}% today)\n"
        
        # Best/worst performer info
        performer_text = ""
        if best_performer:
            performer_text += f"BEST: {best_performer.get('symbol', 'N/A')} (+{best_performer.get('totalGainLossPercent', 0):.1f}%)\n"
        if worst_performer and worst_performer != best_performer:
            performer_text += f"WORST: {worst_performer.get('symbol', 'N/A')} ({worst_performer.get('totalGainLossPercent', 0):.1f}%)\n"
        
        prompt = f"""You are a fun, witty investment advisor for college students. Analyze this investment portfolio and provide insights with humor and actionable advice.

PORTFOLIO DATA:
- Total Portfolio Value: ${total_value:,.2f}
- Total Gain/Loss: ${total_gain_loss:,.2f} ({total_gain_loss_percent:+.1f}%)
- Day Change: ${day_change:,.2f}
- Number of Holdings: {investment_count}

INVESTMENT HOLDINGS:
{investment_text}

PERFORMANCE:
{performer_text}

Please provide insights in this JSON format:
{{
  "portfolioHighlights": {{
    "bestPerformer": "Witty comment about your best performing stock",
    "worstPerformer": "Humorous observation about your worst performing stock",
    "diversificationAlert": "Funny comment about portfolio diversification",
    "riskAssessment": "Witty assessment of portfolio risk level"
  }},
  "stockInsights": [
    {{
      "symbol": "AAPL",
      "insight": "Humorous insight about this specific stock",
      "suggestion": "Actionable tip for this stock",
      "performance": "Funny performance summary"
    }}
  ],
  "portfolioAnalysis": [
    {{
      "type": "performance",
      "message": "Witty analysis of overall portfolio performance",
      "actionable": "Specific step to improve portfolio"
    }}
  ],
  "funFacts": [
    "Humorous observation about the portfolio",
    "Light-hearted comparison or joke about investing"
  ],
  "actionableRecommendations": [
    {{
      "roast": "Funny roast about a specific investment decision",
      "recommendation": "Specific, actionable advice",
      "impact": "Expected impact of following the recommendation"
    }}
  ]
}}

Keep it fun, relatable, and student-friendly. Use emojis sparingly. Make jokes about relatable college investing experiences. Be encouraging but honest about investment decisions. Focus on education and building good investing habits."""

        return prompt
    
    def _call_ollama(self, prompt: str) -> dict:
    """Call Ollama API to generate insights"""
    try:
        response = requests.post(
            f"{self.ollama_url}/api/generate",
            json={
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "num_predict": 800
                }
            },
            timeout=120
        )
        
        if response.status_code == 200:
            result = response.json()
            response_text = result.get('response', '').strip()
            
            print(f"Raw LLM response: {response_text[:500]}")
            
            # Try to extract JSON
            try:
                start_idx = response_text.find('{')
                end_idx = response_text.rfind('}') + 1
                
                if start_idx != -1 and end_idx > start_idx:
                    json_str = response_text[start_idx:end_idx]
                    parsed = json.loads(json_str)
                    print("Successfully parsed JSON response")
                    return parsed
                else:
                    # No JSON found — wrap the raw text in our structure
                    print("No JSON found, wrapping raw text")
                    return {
                        "spendingHighlights": {
                            "biggestExpense": "Check your top spending category!",
                            "overspendingAlert": response_text[:200] if response_text else "Review your spending habits",
                            "positiveReinforcement": response_text if response_text else "Keep tracking your finances!"
                        },
                        "categoryInsights": [],
                        "predictions": [],
                        "funFacts": [response_text[:300] if response_text else "Keep going!"],
                        "actionableRecommendations": [
                            "Review your spending categories",
                            "Set a monthly budget",
                            "Track daily expenses"
                        ]
                    }
            except json.JSONDecodeError as e:
                print(f"JSON parse error: {e}")
                # Return raw text wrapped in structure
                return {
                    "spendingHighlights": {
                        "biggestExpense": "See your category breakdown above",
                        "overspendingAlert": "",
                        "positiveReinforcement": response_text if response_text else "Keep tracking!"
                    },
                    "categoryInsights": [],
                    "predictions": [],
                    "funFacts": [],
                    "actionableRecommendations": [
                        "Review your top spending categories",
                        "Set savings goals",
                        "Track your income vs spending"
                    ]
                }
        else:
            print(f"Ollama returned status: {response.status_code}")
            return self._create_fallback_insights("")
            
    except Exception as e:
        print(f"Error in LLM call: {e}", file=sys.stderr)
        return self._create_fallback_insights("")

def main():
    """Test the AI insights service"""
    if len(sys.argv) < 2:
        print("Usage: python llm_service.py <financial_data_json>")
        sys.exit(1)
    
    try:
        financial_data = json.loads(sys.argv[1])
        ai = FinancialInsightsAI()
        insights = ai.generate_insights(financial_data)
        print(json.dumps(insights, indent=2))
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()