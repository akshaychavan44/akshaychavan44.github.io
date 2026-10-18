from pathlib import Path
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from pypdf import PdfReader

out=Path('public/Akshay-Chavan-Resume.pdf')
# Preserve the existing download before replacing it.
backup=Path('tmp/pdfs/resume-before-projects.pdf')
if not backup.exists(): backup.write_bytes(out.read_bytes())
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='ResumeName',fontName='Helvetica-Bold',fontSize=19,leading=23,alignment=TA_CENTER,spaceAfter=5))
styles.add(ParagraphStyle(name='ContactLine',fontName='Helvetica',fontSize=9,leading=13,alignment=TA_CENTER,spaceAfter=10))
styles.add(ParagraphStyle(name='SectionTitle',fontName='Helvetica-Bold',fontSize=11,leading=14,spaceBefore=11,spaceAfter=7,keepWithNext=True))
styles.add(ParagraphStyle(name='RoleTitle',fontName='Helvetica-Bold',fontSize=10,leading=14,spaceBefore=6,spaceAfter=4,keepWithNext=True))
styles.add(ParagraphStyle(name='ResumeBody',fontName='Helvetica',fontSize=9.5,leading=13,spaceAfter=5))
styles.add(ParagraphStyle(name='ResumeBullet',parent=styles['ResumeBody'],leftIndent=10,firstLineIndent=-8,spaceAfter=3))
styles.add(ParagraphStyle(name='ProjectLink',parent=styles['ResumeBody'],fontSize=9,spaceAfter=5,textColor=colors.HexColor('#174b83')))
story=[]
def p(text,style='ResumeBody'): return Paragraph(text,styles[style])
def section(t):story.append(p(t,'SectionTitle'))
def bullets(items):return [p('- '+x,'ResumeBullet') for x in items]
def project(title,items,url=None):
 parts=[p(title,'RoleTitle')]+bullets(items)
 if url:parts.append(p(f'<link href="{url}">{url}</link>','ProjectLink'))
 story.append(KeepTogether(parts))
story += [p('Akshay Deepak Chavan','ResumeName'),p('Kalyan | +91-7304763996 | <link href="mailto:akshaychavan44.ac@gmail.com">akshaychavan44.ac@gmail.com</link> | <link href="https://github.com/akshaychavan44">GitHub</link> | <link href="https://www.linkedin.com/in/akshay-deepak-chavan/">LinkedIn</link>','ContactLine')]
section('PROFESSIONAL SUMMARY')
story.append(p('Software Developer with experience in designing, developing, and maintaining responsive web applications. Proficient in modern web technologies, with a strong focus on code quality, application performance, and user experience. Committed to delivering reliable, scalable software solutions.'))
section('TECHNICAL SKILLS')
for key,value in [('Languages','Java, JavaScript, TypeScript, HTML, CSS'),('Backend','Spring Boot, Node.js, Express.js, JWT Authentication'),('Frontend','React.js, Next.js, Tailwind CSS, Bootstrap'),('Databases','MongoDB, MySQL, Neon PostgreSQL'),('Tools','Git, GitHub, Maven, Postman, STS, VS Code, Render, Vercel')]: story.append(p(f'<b>{key}:</b> {value}'))
section('PROFESSIONAL EXPERIENCE')
story.append(p('Software Developer Intern - Zootechx | Aug 2026 - Present','RoleTitle'))
project('CRM / ERP Platform - Full Stack Developer',['Built an end-to-end CRM module including leads, follow-ups, clients, quotations, invoices, payments, and role-based dashboards for super admin, sub-admin, sales, developer, and marketing teams using Next.js, TypeScript, Node.js, React, Tailwind CSS, and PostgreSQL.'],'https://zootechx.vercel.app/')
project('DJ Impex - Textile Portfolio Website - Full Stack Developer',['Developed a responsive textile portfolio using Next.js, TypeScript, PostgreSQL, and Tailwind CSS to showcase fabric collections and company information. Implemented interactive UI animations and reusable components, with GitHub collaboration.'],'https://dj-impex-taupe.vercel.app/')
project('Rewear - Frontend Contributor',['Built the Quiz and How It Works pages in Next.js, including responsive layouts, reusable UI components, modals, and animations using TypeScript, Tailwind CSS, and Framer Motion.'],'https://rewear-pi.vercel.app/')
story.append(p('Healthcare Business Analyst - Accenture | Aug 2024 - Apr 2026','RoleTitle'))
story+=bullets(['Verified provider and practitioner information using internal applications to support accurate provider enrollment.','Performed data management, enrollment, and record updates while maintaining accurate case documentation and compliance with client guidelines.','Communicated with clients to identify, clarify, and resolve data discrepancies, ensuring data accuracy.'])
story.append(PageBreak())
section('PERSONAL PROJECTS')
project('Aarti Collection - Kids Clothing E-Commerce',['Designed and developed a responsive kids clothing website using Node.js, Express.js, React, Tailwind CSS, Neon PostgreSQL, and JWT authentication, with an organized product catalog, category pages, and search and filters by age group and size.','Integrated a WhatsApp chat button on product pages so customers can ask about availability, confirm details, and place orders directly with the seller.'],'https://aarti-collection.vercel.app/')
project('Trizen - Service Provider Platform',['Developed a service provider application where professionals can register, create profiles, and list their services.','Built a dedicated admin panel to manage service provider listings.'],'https://client-xi-blond-60.vercel.app/')
project('Job Application Tracker - Java, Spring Boot, React.js, MongoDB',['Built a full-stack job application tracking system with secure login, application CRUD, interview tracking, status updates, and dashboard analytics.','Developed protected REST APIs with Spring Boot and MongoDB for users, applications, and interviews; tested and validated APIs using Postman.'])
project('E-Commerce Management System - Java, Spring Boot, MongoDB, Microservices',['Designed and deployed each microservice independently to support modular development, maintenance, and scalability.','Implemented REST APIs for inter-service communication, CRUD operations, database integration, and validation.'])
project('AI Personal Vault - Node.js, Express.js, React, Tailwind CSS, PostgreSQL',['Built an AI-powered personal storage and search platform for organizing and retrieving files, images, and notes.','Implemented cloud-based storage and intelligent search for fast retrieval of user-uploaded content through a simple interface.'])
section('CERTIFICATION')
story.append(p('Java Full Stack Development Certification - Quality Software Technologies'))
section('EDUCATION')
data=[[p('<b>Program</b>'),p('<b>Institution</b>'),p('<b>Score</b>'),p('<b>Year</b>')]]
for row in [('B.Sc. Information Technology','Saket College','8.70/10','2020 - 2023'),('HSC','Saket College','56.20%','2019 - 2020'),('SSC','M.R.G. School','81.60%','2017 - 2018')]: data.append([p(v) for v in row])
t=Table(data,colWidths=[192,135,70,100],hAlign='LEFT');t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LINEBELOW',(0,0),(-1,0),.5,colors.HexColor('#cccccc')),('LEFTPADDING',(0,0),(-1,-1),0),('TOPPADDING',(0,0),(-1,-1),3),('BOTTOMPADDING',(0,0),(-1,-1),3)]));story.append(t)
def footer(c,d):
 c.setFont('Helvetica',8);c.setFillColor(colors.HexColor('#666666'));c.drawRightString(A4[0]-44,25,f'{d.page}')
SimpleDocTemplate(str(out),pagesize=A4,rightMargin=44,leftMargin=44,topMargin=32,bottomMargin=35,title='Akshay Chavan Resume',author='Akshay Chavan').build(story,onFirstPage=footer,onLaterPages=footer)
r=PdfReader(out)
assert len(r.pages)==2, f'Unexpected page count: {len(r.pages)}'
text='\n'.join(page.extract_text() for page in r.pages)
assert 'Aarti Collection' in text and 'Trizen' in text
links=[a.get_object().get('/A',{}).get('/URI') for page in r.pages for a in page.get('/Annots',[])]
assert 'https://aarti-collection.vercel.app/' in links
assert 'https://client-xi-blond-60.vercel.app/' in links
print('Verified 2-page resume with both new projects and clickable live links.')
