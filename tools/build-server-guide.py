"""Reproducible Persian operator guide. compact_reference_guide preset.
Named overrides: Windows Persian font Tahoma (no system font installation),
9pt Consolas command blocks, 24pt editorial title. No tables or faux lists.
"""
from pathlib import Path
import sys, re
sys.path.insert(0, 'C:/Users/Lenovo/.gapcode/plugins/cache/gapgpt/documents/26.722.10000/skills/documents/scripts')
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.style import WD_STYLE_TYPE
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from fa_docx import set_rtl_styles, set_rtl_paragraph

root=Path(__file__).resolve().parent.parent
doc=Document(); set_rtl_styles(doc, 'Tahoma')
sec=doc.sections[0]
sec.page_width=Inches(8.5); sec.page_height=Inches(11)
sec.top_margin=sec.bottom_margin=sec.left_margin=sec.right_margin=Inches(1)
sec.header_distance=sec.footer_distance=Inches(.492)
for name,size,before,after,color in [('Normal',11,0,6,'243446'),('Title',24,0,12,'0B2545'),('Subtitle',10,0,12,'607184'),('Heading 1',16,18,10,'2E74B5'),('Heading 2',13,14,7,'2E74B5'),('Heading 3',12,10,5,'1F4D78')]:
 s=doc.styles[name];s.font.name='Tahoma';s.font.size=Pt(size);s.font.color.rgb=RGBColor.from_string(color)
 s.font.bold=name.startswith('Heading') or name=='Title'
 pr=s.element.get_or_add_rPr();cs=OxmlElement('w:szCs');cs.set(qn('w:val'),str(size*2));pr.append(cs)
 fmt=s.paragraph_format;fmt.space_before=Pt(before);fmt.space_after=Pt(after);fmt.line_spacing=1.25
 fmt.alignment=WD_ALIGN_PARAGRAPH.RIGHT;fmt.widow_control=True
 if name.startswith('Heading'):fmt.keep_with_next=True
code=doc.styles.add_style('Command',WD_STYLE_TYPE.PARAGRAPH)
code.font.name='Consolas';code.font.size=Pt(9);code.font.color.rgb=RGBColor.from_string('19334A')
code.paragraph_format.space_before=Pt(0);code.paragraph_format.space_after=Pt(3);code.paragraph_format.line_spacing=1.15
code.paragraph_format.alignment=WD_ALIGN_PARAGRAPH.LEFT
shading=OxmlElement('w:shd');shading.set(qn('w:fill'),'F4F6F9');code.element.get_or_add_pPr().append(shading)
header=sec.header.paragraphs[0];header.text='NEON COAST  /  راهنمای راه‌اندازی'
set_rtl_paragraph(header,font='Tahoma',size=9);header.alignment=WD_ALIGN_PARAGRAPH.RIGHT
footer=sec.footer.paragraphs[0];footer.alignment=WD_ALIGN_PARAGRAPH.RIGHT
r=footer.add_run();field=OxmlElement('w:fldSimple');field.set(qn('w:instr'),'PAGE');r._r.addnext(field)
footer.paragraph_format.space_after=Pt(0)
in_code=False;paragraph=[]
def prose(text,style='Normal'):
 p=doc.add_paragraph(style=style)
 # Keep Latin technical fragments LTR while the paragraph is Persian RTL.
 for part in re.split(r'([A-Za-z0-9][A-Za-z0-9_./:#=+()<> -]*)',text):
  if not part:continue
  run=p.add_run(part)
  if re.search(r'[\u0600-\u06ff]',part):
   rt=OxmlElement('w:rtl');run._r.get_or_add_rPr().append(rt)
 bidi=OxmlElement('w:bidi');p._p.get_or_add_pPr().append(bidi)
 return p
def flush():
 if paragraph:prose(' '.join(paragraph));paragraph.clear()
for line in (root/'SERVER-GUIDE.fa.md').read_text(encoding='utf-8').splitlines():
 if line.startswith('```'):
  flush();in_code=not in_code;continue
 if in_code:
  p=doc.add_paragraph(line,style='Command');continue
 if line=='<!-- page -->':flush();doc.add_page_break();continue
 if line.startswith('# '):flush();prose(line[2:],'Title');continue
 if line.startswith('## '):flush();prose(line[3:],'Heading 1');continue
 if not line.strip():flush();continue
 paragraph.append(line)
flush()
doc.core_properties.title='راهنمای راه‌اندازی سرور Neon Coast'
doc.core_properties.subject='Vercel, Redis, dedicated server, verification and Steam readiness'
doc.core_properties.author='';doc.core_properties.last_modified_by=''
out=root/'deliverables';out.mkdir(exist_ok=True)
target=out/'Neon-Coast-Server-Guide.fa.docx';doc.save(target)
# Structural gate: page geometry, RTL Persian paragraphs, explicit typography.
assert sec.page_width==Inches(8.5) and sec.left_margin==Inches(1)
for p in doc.paragraphs:
 if re.search(r'[\u0600-\u06ff]',p.text):assert p._p.find('w:pPr/w:bidi',p._p.nsmap) is not None
print(target.name)
