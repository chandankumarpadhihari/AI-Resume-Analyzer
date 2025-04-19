const { PDFDocument } = require('pdf-lib');
const mammoth = require('mammoth');
const { Readable } = require('stream');
const multipart = require('parse-multipart');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Parse the multipart form data
    const boundary = event.headers['content-type'].split('=')[1];
    const parts = multipart.Parse(Buffer.from(event.body, 'base64'), boundary);
    const file = parts[0];

    if (!file) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No file provided' })
      };
    }

    let text = '';

    // Handle different file types
    if (file.type === 'application/pdf') {
      try {
        console.log('Processing PDF file...');
        console.log('File size:', file.data.length);
        
        // Load the PDF document
        const pdfDoc = await PDFDocument.load(file.data);
        console.log('PDF loaded successfully');
        
        const pages = pdfDoc.getPages();
        console.log(`Found ${pages.length} pages in PDF`);
        
        if (pages.length === 0) {
          throw new Error('PDF contains no pages');
        }

        // Try to extract text from each page
        for (let i = 0; i < pages.length; i++) {
          try {
            const page = pages[i];
            const pageText = await page.getText();
            console.log(`Page ${i + 1} text length:`, pageText.length);
            
            if (pageText && pageText.trim()) {
              text += pageText.trim() + '\n\n';
            } else {
              console.log(`No text found on page ${i + 1}`);
            }
          } catch (pageError) {
            console.error(`Error processing page ${i + 1}:`, pageError);
            // Continue with next page even if one fails
          }
        }
        
        if (!text.trim()) {
          console.log('No text content could be extracted from any page');
          throw new Error('No text content could be extracted from PDF. Please try uploading a Word document (DOC or DOCX) instead, or paste your resume text directly.');
        }

        console.log('Successfully extracted text from PDF');
      } catch (error) {
        console.error('PDF processing error:', error);
        return {
          statusCode: 400,
          body: JSON.stringify({ 
            error: 'Failed to process PDF file. ' + error.message,
            suggestion: 'Please try uploading a Word document (DOC or DOCX) instead, or paste your resume text directly. Word documents usually provide better text extraction results.'
          })
        };
      }
    } else if (file.type === 'application/msword' || 
               file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        const result = await mammoth.extractRawText({ buffer: file.data });
        text = result.value;
      } catch (error) {
        console.error('DOC processing error:', error);
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Failed to process document file' })
        };
      }
    } else if (file.type === 'text/plain') {
      text = file.data.toString();
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Unsupported file type',
          suggestion: 'Please upload a Word document (DOC or DOCX), PDF, or text file.'
        })
      };
    }

    if (!text.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'No text content found in file',
          suggestion: 'Please try uploading a different file or paste your resume text directly.'
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ text })
    };
  } catch (error) {
    console.error('Error processing file:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}; 