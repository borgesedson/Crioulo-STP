import zipfile
import re
import sys

def read_docx(path):
    with zipfile.ZipFile(path) as docx:
        xml = docx.read('word/document.xml').decode('utf-8')
        paragraphs = re.findall(r'<w:p.*?>(.*?)</w:p>', xml)
        for p in paragraphs:
            text = ''.join(re.findall(r'<w:t(?:.*?)>(.*?)</w:t>', p))
            if text:
                print(text)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        read_docx(sys.argv[1])
