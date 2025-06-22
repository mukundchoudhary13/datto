document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            
            // Clear any status messages when switching tabs
            clearStatus();
        });
    });
    
    // Image to PDF functionality
    const imageInput = document.getElementById('image-input');
    const imageUploadArea = document.getElementById('image-upload-area');
    const imagePreview = document.getElementById('image-preview');
    const convertBtn = document.getElementById('convert-btn');
    
    let imageFiles = [];
    
    // Handle drag and drop for images
    setupDragAndDrop(imageUploadArea, imageInput, handleImageFiles);
    
    // Handle file selection via input
    imageInput.addEventListener('change', function() {
        handleImageFiles(this.files);
    });
    
    function handleImageFiles(files) {
        if (!files || files.length === 0) return;
        
        // Filter only image files
        const newImageFiles = Array.from(files).filter(file => 
            file.type.startsWith('image/')
        );
        
        if (newImageFiles.length === 0) {
            showStatus('Please select only image files (JPG, PNG, etc.)', 'error');
            return;
        }
        
        imageFiles = [...imageFiles, ...newImageFiles];
        updateImagePreview();
        convertBtn.disabled = imageFiles.length === 0;
        clearStatus();
    }
    
    function updateImagePreview() {
        imagePreview.innerHTML = '';
        
        imageFiles.forEach((file, index) => {
            const filePreview = document.createElement('div');
            filePreview.className = 'file-preview';
            
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.alt = file.name;
                    filePreview.appendChild(img);
                    
                    const fileInfo = document.createElement('div');
                    fileInfo.className = 'file-info';
                    fileInfo.textContent = file.name.length > 15 
                        ? file.name.substring(0, 12) + '...' 
                        : file.name;
                    filePreview.appendChild(fileInfo);
                    
                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'remove-btn';
                    removeBtn.innerHTML = '&times;';
                    removeBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        imageFiles.splice(index, 1);
                        updateImagePreview();
                        convertBtn.disabled = imageFiles.length === 0;
                    });
                    filePreview.appendChild(removeBtn);
                };
                reader.readAsDataURL(file);
            }
            
            imagePreview.appendChild(filePreview);
        });
    }
    
    // Convert images to PDF
    convertBtn.addEventListener('click', async function() {
        if (imageFiles.length === 0) {
            showStatus('No images selected', 'error');
            return;
        }
        
        showStatus('Creating PDF...', 'info');
        convertBtn.disabled = true;
        
        try {
            // Using jsPDF for image to PDF conversion
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Process images in sequence
            for (let i = 0; i < imageFiles.length; i++) {
                const file = imageFiles[i];
                const imgData = await readFileAsDataURL(file);
                const img = await loadImage(imgData);
                
                // Calculate dimensions to fit the page
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                
                let imgWidth = pageWidth - 20; // 10px margin on each side
                let imgHeight = (img.height * imgWidth) / img.width;
                
                if (imgHeight > pageHeight - 20) {
                    imgHeight = pageHeight - 20;
                    imgWidth = (img.width * imgHeight) / img.height;
                }
                
                const x = (pageWidth - imgWidth) / 2;
                const y = (pageHeight - imgHeight) / 2;
                
                if (i > 0) {
                    doc.addPage();
                }
                
                doc.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
            }
            
            // Save the PDF
            doc.save('converted_images.pdf');
            showStatus('PDF created successfully!', 'success');
        } catch (error) {
            console.error('Error creating PDF:', error);
            showStatus('Error creating PDF: ' + error.message, 'error');
        } finally {
            convertBtn.disabled = false;
        }
    });
    
    // Merge PDFs functionality
    const pdfInput = document.getElementById('pdf-input');
    const pdfUploadArea = document.getElementById('pdf-upload-area');
    const pdfPreview = document.getElementById('pdf-preview');
    const mergeBtn = document.getElementById('merge-btn');
    
    let pdfFiles = [];
    
    // Handle drag and drop for PDFs
    setupDragAndDrop(pdfUploadArea, pdfInput, handlePdfFiles);
    
    // Handle file selection via input
    pdfInput.addEventListener('change', function() {
        handlePdfFiles(this.files);
    });
    
    function handlePdfFiles(files) {
        if (!files || files.length === 0) return;
        
        // Filter only PDF files
        const newPdfFiles = Array.from(files).filter(file => 
            file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
        );
        
        if (newPdfFiles.length === 0) {
            showStatus('Please select only PDF files', 'error');
            return;
        }
        
        pdfFiles = [...pdfFiles, ...newPdfFiles];
        updatePdfPreview();
        mergeBtn.disabled = pdfFiles.length < 2;
        clearStatus();
    }
    
    function updatePdfPreview() {
        pdfPreview.innerHTML = '';
        
        pdfFiles.forEach((file, index) => {
            const filePreview = document.createElement('div');
            filePreview.className = 'file-preview';
            
            // PDF icon
            const pdfIcon = document.createElement('div');
            pdfIcon.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ff0000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
            `;
            filePreview.appendChild(pdfIcon);
            
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            fileInfo.textContent = file.name.length > 15 
                ? file.name.substring(0, 12) + '...' 
                : file.name;
            filePreview.appendChild(fileInfo);
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '&times;';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                pdfFiles.splice(index, 1);
                updatePdfPreview();
                mergeBtn.disabled = pdfFiles.length < 2;
            });
            filePreview.appendChild(removeBtn);
            
            pdfPreview.appendChild(filePreview);
        });
    }
    
    // Merge PDFs
    mergeBtn.addEventListener('click', async function() {
        if (pdfFiles.length < 2) {
            showStatus('Please select at least 2 PDF files to merge', 'error');
            return;
        }
        
        showStatus('Merging PDFs...', 'info');
        mergeBtn.disabled = true;
        
        try {
            const { PDFDocument } = PDFLib;
            
            // Create a new PDF document
            const mergedPdf = await PDFDocument.create();
            
            // Process each PDF in order
            for (const file of pdfFiles) {
                const fileBytes = await readFileAsArrayBuffer(file);
                const pdfDoc = await PDFDocument.load(fileBytes);
                
                // Copy all pages from the current PDF to the merged PDF
                const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                pages.forEach(page => mergedPdf.addPage(page));
            }
            
            // Save the merged PDF
            const mergedPdfBytes = await mergedPdf.save();
            downloadBlob(new Blob([mergedPdfBytes], { type: 'application/pdf' }), 'merged.pdf');
            showStatus('PDFs merged successfully!', 'success');
        } catch (error) {
            console.error('Error merging PDFs:', error);
            showStatus('Error merging PDFs: ' + error.message, 'error');
        } finally {
            mergeBtn.disabled = false;
        }
    });
    
    // Helper functions
    function setupDragAndDrop(dropArea, inputElement, callback) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight() {
            dropArea.style.borderColor = 'var(--accent-color)';
            dropArea.style.backgroundColor = 'rgba(79, 195, 247, 0.1)';
        }
        
        function unhighlight() {
            dropArea.style.borderColor = '#ddd';
            dropArea.style.backgroundColor = 'white';
        }
        
        dropArea.addEventListener('drop', function(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            inputElement.files = files;
            callback(files);
        }, false);
    }
    
    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    function readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }
    
    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }
    
    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }
    
    function showStatus(message, type) {
        const statusElement = document.getElementById('status');
        statusElement.textContent = message;
        statusElement.className = 'status ' + type;
    }
    
    function clearStatus() {
        const statusElement = document.getElementById('status');
        statusElement.className = 'status';
        statusElement.textContent = '';
    }
});