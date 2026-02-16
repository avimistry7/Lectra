
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export const extractTextFromFile = async (file: File): Promise<string> => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'pdf':
      return await extractTextFromPDF(file);
    case 'pptx':
      return await extractTextFromPPTX(file);
    case 'txt':
    case 'md':
    case 'text':
      return await readFileAsText(file);
    default:
      throw new Error('Unsupported file format');
  }
};

const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

const extractTextFromPDF = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str);
    fullText += strings.join(' ') + '\n';
  }

  return fullText;
};

const extractTextFromPPTX = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));
  
  // Sort files numerically by slide index
  slideFiles.sort((a, b) => {
    const aNum = parseInt(a.replace(/[^\d]/g, ''), 10);
    const bNum = parseInt(b.replace(/[^\d]/g, ''), 10);
    return aNum - bNum;
  });

  let fullText = '';
  const parser = new DOMParser();

  for (const slidePath of slideFiles) {
    const slideXml = await zip.files[slidePath].async('string');
    const doc = parser.parseFromString(slideXml, 'application/xml');
    const textNodes = doc.getElementsByTagName('a:t');
    
    let slideText = '';
    for (let i = 0; i < textNodes.length; i++) {
      slideText += (textNodes[i].textContent || '') + ' ';
    }
    fullText += `--- Slide ${slidePath.match(/\d+/)?.[0]} ---\n${slideText}\n\n`;
  }

  if (!fullText.trim()) {
    throw new Error('No text content found in PPTX file.');
  }

  return fullText;
};
