#!/usr/bin/env python3
"""
PDF Processing Server
A simple HTTP server for processing PDF bank statements
"""
from flask import Flask, request, jsonify
from pdf_processor import BankStatementProcessor
import base64
import io
import os
app = Flask(__name__)
processor = BankStatementProcessor()
@app.route('/process-pdf', methods=['POST'])
def process_pdf():
    try:
        data = request.get_json()
        
        if not data or 'pdfData' not in data:
            return jsonify({
                'success': False,
                'error': 'No PDF data provided'
            }), 400

        # Check size limit (5MB)
        if len(data['pdfData']) > 5 * 1024 * 1024:
            return jsonify({
                'success': False,
                'error': 'File too large. Max 5MB.'
            }), 400
        
        # Handle both base64 PDF data and plain text
        pdf_data_str = data['pdfData']
        
        # Try to decode as base64 first
        try:
            pdf_data = base64.b64decode(pdf_data_str)
            
            # Check if it's a valid PDF
            if not pdf_data.startswith(b'%PDF'):
                # Try to process as text anyway
                pdf_data = pdf_data_str.encode('utf-8')
                result = processor.process_pdf(pdf_data)
            else:
                # If successful, process as PDF
                result = processor.process_pdf(pdf_data)
        except Exception as e:
            # If base64 decoding fails, treat as plain text
            pdf_data = pdf_data_str.encode('utf-8')
            result = processor.process_pdf(pdf_data)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'transactions': []
        }), 500
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)