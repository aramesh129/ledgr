#!/usr/bin/env python3
"""
PDF Bank Statement Processor - Simple Version
Extracts transactions from PDF bank statements
"""

import pdfplumber
import pandas as pd
import re
import json
import sys
from datetime import datetime
from typing import List, Dict, Any, Optional
import io
import base64

class BankStatementProcessor:
    def __init__(self):
        self.date_pattern = r'\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?'
        self.amount_pattern = r'\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)'
        
    def extract_text_from_pdf(self, pdf_data: bytes) -> str:
        """Extract text from PDF bytes or plain text"""
        try:
            # First try to decode as plain text (for testing)
            try:
                text = pdf_data.decode('utf-8')
                # If it looks like plain text (not PDF), return it
                if not text.startswith('%PDF'):
                    return text
            except:
                pass
            
            # If it's a real PDF, use pdfplumber
            with pdfplumber.open(io.BytesIO(pdf_data)) as pdf:
                text = ""
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                return text
        except Exception as e:
            raise Exception(f"Error extracting text from PDF: {str(e)}")

    def process_pdf(self, pdf_data: bytes) -> Dict[str, Any]:
        """Process PDF and extract transactions"""
        try:
            # Extract text
            text = self.extract_text_from_pdf(pdf_data)
            
            # Find transaction lines
            lines = text.split('\n')
            transactions = []
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                    
                # Look for lines with date and amount
                if re.search(self.date_pattern, line) and re.search(self.amount_pattern, line):
                    # Skip header lines
                    if any(word in line.lower() for word in ['date', 'description', 'withdrawal', 'balance']):
                        continue
                    
                    # Parse the line
                    transaction = self.parse_line(line)
                    if transaction:
                        transactions.append(transaction)
            
            # Create summary
            total_income = sum(t['amount'] for t in transactions if t['amount'] > 0)
            total_expenses = sum(abs(t['amount']) for t in transactions if t['amount'] < 0)
            net_flow = total_income - total_expenses
            
            # Get unique merchants
            merchants = list(set(t['merchant'] for t in transactions if t['merchant']))
            
            # Get category breakdown
            categories = {}
            for transaction in transactions:
                category = transaction['category']
                if category not in categories:
                    categories[category] = 0
                categories[category] += abs(transaction['amount'])
            
            return {
                'success': True,
                'transactions': transactions,
                'summary': {
                    'totalTransactions': len(transactions),
                    'totalIncome': total_income,
                    'totalExpenses': total_expenses,
                    'netFlow': net_flow,
                    'uniqueMerchants': len(merchants),
                    'categories': categories
                },
                'metadata': {
                    'processedAt': datetime.now().isoformat(),
                    'extractedTextLength': len(text),
                    'transactionLinesFound': len(transactions)
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'transactions': [],
                'summary': {
                    'totalTransactions': 0,
                    'totalIncome': 0,
                    'totalExpenses': 0,
                    'netFlow': 0,
                    'uniqueMerchants': 0,
                    'categories': {}
                }
            }
    
    def parse_line(self, line: str) -> Optional[Dict[str, Any]]:
        """Parse a single transaction line"""
        # Find date
        date_match = re.search(self.date_pattern, line)
        if not date_match:
            return None
            
        date_str = date_match.group()
        
        # Find amounts
        amount_matches = re.findall(self.amount_pattern, line)
        if not amount_matches:
            return None
            
        # Get the first amount (usually the transaction amount)
        amount_str = amount_matches[0]
        amount = float(amount_str.replace(',', ''))
        
        # Determine if it's a withdrawal or deposit
        # Look for keywords that indicate withdrawal (money going out)
        withdrawal_keywords = ['bill', 'withdrawal', 'debit', 'payment', 'rent', 'electric', 'phone', 'internet', 'tax', 'purchase', 'buy', 'spent', 'fee', 'charge', 'starbucks', 'amazon', 'target', 'spotify', 'gas', 'meijer', 'venmo', 'apple', 'store', 'subscription', 'transfer', 'groceries', 'supplies', 'textbooks', 'campus', 'coffee', 'restaurant', 'food', 'shopping']
        is_withdrawal = any(keyword in line.lower() for keyword in withdrawal_keywords)
        
        if is_withdrawal:
            amount = -abs(amount)  # Money going out = negative
        else:
            amount = abs(amount)   # Money coming in = positive
        
        # Extract description (everything between date and first amount)
        date_end = date_match.end()
        amount_start = line.find('$' + amount_str)
        description = line[date_end:amount_start].strip()
        
        # Parse date
        date = self.parse_date(date_str)
        if not date:
            return None
            
        # Determine transaction type
        transaction_type = 'debit' if amount < 0 else 'credit'
        
        # Categorize
        category = self.categorize_transaction(description)
        
        return {
            'date': date.strftime('%Y-%m-%d'),
            'description': description,
            'amount': amount,
            'merchant': description,
            'category': category,
            'transactionType': transaction_type
        }
    
    def parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse date string to datetime object"""
        date_formats = [
            '%m/%d/%Y', '%m-%d-%Y', '%m/%d/%y', '%m-%d-%y',
            '%d/%m/%Y', '%d-%m-%Y', '%d/%m/%y', '%d-%m-%y',
            '%Y-%m-%d', '%Y/%m/%d', '%m/%d', '%m-%d'
        ]
        
        for fmt in date_formats:
            try:
                parsed_date = datetime.strptime(date_str, fmt)
                # If no year specified, assume current year
                if parsed_date.year == 1900:
                    parsed_date = parsed_date.replace(year=2024)
                return parsed_date
            except ValueError:
                continue
        
        return None
    
    def categorize_transaction(self, description: str) -> str:
        """Categorize transaction based on description"""
        desc_lower = description.lower()
        
        if any(keyword in desc_lower for keyword in ['rent', 'electric', 'phone', 'internet', 'utilities']):
            return 'Utilities'
        elif any(keyword in desc_lower for keyword in ['bill', 'payment']):
            return 'Bills'
        elif any(keyword in desc_lower for keyword in ['deposit', 'salary', 'payroll']):
            return 'Income'
        elif any(keyword in desc_lower for keyword in ['interest', 'earned']):
            return 'Interest'
        elif any(keyword in desc_lower for keyword in ['tax', 'withholding']):
            return 'Taxes'
        elif any(keyword in desc_lower for keyword in ['check', 'payment']):
            return 'Income'
        else:
            return 'Other'

def main():
    """Main function for command line usage"""
    if len(sys.argv) != 2:
        print("Usage: python pdf_processor.py <pdf_file>")
        sys.exit(1)
    
    pdf_file = sys.argv[1]
    
    try:
        with open(pdf_file, 'rb') as f:
            pdf_data = f.read()
        
        processor = BankStatementProcessor()
        result = processor.process_pdf(pdf_data)
        
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()