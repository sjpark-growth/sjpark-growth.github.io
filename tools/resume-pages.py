# resume-pages.py — 이력서 PDF(files/sjpark_resume.pdf)를 쪽 그림(files/resume-p1.webp …)으로 바꾸고
# 보기 페이지 resume-pdf.html 의 <!-- pages:start --> ~ <!-- pages:end --> 사이를 다시 쓴다. (2026-11-22)
#
# 왜: 포트폴리오의 「이력서 PDF」 링크는 PDF 를 바로 내려받지 않고 새 창(resume-pdf.html)에서 먼저 보여 준다.
#     휴대폰(안드로이드 크롬 · 카카오톡 안 브라우저)은 PDF 를 페이지 안에 그리지 못하거나 곧바로 내려받아 버려서,
#     어디서나 같게 보이도록 쪽을 그림으로 보여 주고 내려받기는 그 페이지의 단추로 한다.
#
# 쓰는 법(저장소 맨 위에서): python -I -X utf8 tools/resume-pages.py
#   - 필요한 것: poppler 의 pdftoppm(PATH), Python Pillow.
#   - 이력서 PDF 를 바꾸면(files/sjpark_resume.pdf) 이 도구를 다시 돌리고 그림 · resume-pdf.html 을 같이 커밋한다.
#   - 쪽 수가 줄면 남는 옛 그림(resume-pN.webp)은 지운다.
import glob
import os
import re
import subprocess
import sys
import tempfile

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.path.join(ROOT, 'files', 'sjpark_resume.pdf')
OUT = os.path.join(ROOT, 'files')
PAGE = os.path.join(ROOT, 'resume-pdf.html')
DPI = 150          # A4 → 1240×1754 — 휴대폰 3배 화면 · PC 125% 배율에서도 글자가 흐리지 않은 크기
QUALITY = 80


def main():
    if not os.path.exists(PDF):
        sys.exit('PDF 없음: ' + PDF)
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(['pdftoppm', '-r', str(DPI), '-png', PDF, os.path.join(tmp, 'p')], check=True)
        pngs = sorted(glob.glob(os.path.join(tmp, 'p-*.png')), key=lambda p: int(re.search(r'-(\d+)\.png$', p).group(1)))
        if not pngs:
            sys.exit('쪽 그림을 못 만듦')
        sizes = []
        for i, src in enumerate(pngs, 1):
            im = Image.open(src).convert('RGB')
            dst = os.path.join(OUT, 'resume-p%d.webp' % i)
            im.save(dst, 'WEBP', quality=QUALITY, method=6)
            sizes.append((i, im.size, os.path.getsize(dst)))
    n = len(sizes)
    for old in glob.glob(os.path.join(OUT, 'resume-p*.webp')):
        m = re.search(r'resume-p(\d+)\.webp$', old)
        if m and int(m.group(1)) > n:
            os.remove(old)

    rows = []
    for i, (w, h), _ in sizes:
        lazy = '' if i == 1 else ' loading="lazy"'
        rows.append('    <figure class="pg"><img src="files/resume-p%d.webp" width="%d" height="%d" alt="이력서 %d / %d쪽" decoding="async"%s></figure>' % (i, w, h, i, n, lazy))
    html = open(PAGE, encoding='utf-8', newline='').read()
    nl = '\r\n' if '\r\n' in html else '\n'
    block = '<!-- pages:start -->' + nl + nl.join(rows) + nl + '    <!-- pages:end -->'
    new, k = re.subn(r'<!-- pages:start -->.*?<!-- pages:end -->', lambda m: block, html, flags=re.S)
    if k != 1:
        sys.exit('resume-pdf.html 에 pages:start ~ pages:end 표시가 없음')
    with open(PAGE, 'w', encoding='utf-8', newline='') as f:
        f.write(new)
    total = sum(s for _, _, s in sizes)
    for i, (w, h), s in sizes:
        print('resume-p%d.webp  %dx%d  %.0fKB' % (i, w, h, s / 1024))
    print('쪽 %d · 합계 %.0fKB · resume-pdf.html 갱신' % (n, total / 1024))


if __name__ == '__main__':
    main()
