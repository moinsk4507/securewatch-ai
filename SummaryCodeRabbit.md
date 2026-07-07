You are writing a complete MSc.IT Part-2 Project Black Book for a
project called "SecureWatch AI" - a real-time cybersecurity
monitoring dashboard with ML-powered threat detection.

I am attaching/pasting the following project documents as your
ONLY source of technical truth. Do not invent any technology,
API, feature, or architecture detail not present in these files:

1. PRD.md (Product Requirements Document)
2. TRD.md (Technical Requirements Document)
3. SCHEMA.md (Backend Schema Document)
4. ARCHITECTURE.md
5. UIUX.md (UI/UX Design Brief)
6. APPFLOW.md (App Flow Document)
7. STRUCTURE.md (Codebase Structure)
8. Implementation Plan (5-Day Execution Plan)

---

YOUR TASK:

Write the complete black book following the EXACT chapter structure,
tone, and formatting style below (this mirrors the standard MSc.IT
Part-2 project report format used at Maharashtra College of Arts,
Science and Commerce). Where the original reference black book
includes a screenshot, diagram, or code snippet, you must insert
a clearly labeled PLACEHOLDER HEADING instead (e.g. "[INSERT
SCREENSHOT: Login Page Interface]" or "[INSERT CODE SNIPPET:
JWT Token Generation]" or "[INSERT DIAGRAM: System Architecture]")

- I will personally add the actual images, diagrams, and code
  screenshots myself afterward. Do NOT generate ASCII diagrams or
  fake code blocks as substitutes - just the placeholder heading
  and a one-line description of what should go there.

---

REQUIRED STRUCTURE (follow this exactly):

COVER PAGE

- Title: "SecureWatch AI"
- Subtitle: "Real-Time Cybersecurity Monitoring & Threat Detection Platform"
- MSC.IT PART-2 header/footer style matching reference

ABSTRACT

- 1 paragraph, similar length/tone to reference abstract
- Cover: problem being solved (delayed threat detection, manual
  log analysis), the ML approach (Isolation Forest + Random
  Forest), the tech stack (React/FastAPI/PostgreSQL/scikit-learn),
  and the overall contribution

ACKNOWLEDGEMENT

- Same template as reference, just adjust project name reference
- Keep placeholder for [Principal Name], [HOD Name], [Guide Name]
  - I will fill these in myself, use generic bracketed placeholders

DECLARATION

- Same standard declaration template as reference

TABLE OF CONTENTS

- Match the reference's chapter numbering style exactly:
  1. Project Overview (Introduction, Scope & Objective, Modules,
     Existing vs Proposed System)
  2. Literature Review (Introduction, Reviewed Literature, Summary)
  3. Project Design (ER Diagram, Use Case Diagram, Sequence
     Diagram, Activity Diagram, Data Flow Diagram, System Architecture)
  4. Advantages, Limitations & Application
  5. Implementation (Dataset/Data Handling equivalent for
     SecureWatch = ML Training Data Generation, Data Preprocessing
     = Feature Extraction, Model Training = IF+RF Training, Model
     Saving and Integration, Application Deployment)
  6. Testing the Model (ML pipeline testing + backend pytest suite)
  7. Graphical User Interface (Overview, Login Page, Dashboard,
     Live Logs, Alerts, Geo Map, ML Engine, Rules, Settings, Admin,
     System Health)
  8. Testing (Test cases in the same Description/Expected
     Result/Actual Result/Status format as reference)
  9. Conclusion (Summary of Achievements, Future Work, Advantages,
     Disadvantages)
  10. Bibliography and References

---

CHAPTER 1: PROJECT OVERVIEW

1.1 Introduction
Write 2-3 paragraphs explaining cybersecurity monitoring's
importance, why traditional/manual log review is insufficient,
how ML-based anomaly detection improves early threat identification,
and introduce SecureWatch AI as the proposed solution. Base
technical claims strictly on PRD.md's project overview section.

1.2 Scope & Objective
Scope paragraph + bulleted Objectives list (pull directly from
PRD.md Section 1.3 Project Objectives, rephrase in academic tone)

1.3 Modules & Its Description
Write one paragraph per module based on PRD.md's core features.
Suggested modules: Authentication & RBAC Module, Log Ingestion
Module, ML Anomaly Detection Module, Alert Management Module,
Rules Engine Module, System Health Monitoring Module, Dashboard
& Visualization Module

1.4 Existing System and Proposed System
Existing System paragraph: describe limitations of traditional
SIEM/manual log review (reactive, no ML, delayed detection)
Proposed System paragraph: describe SecureWatch AI's improvements
(real-time ML scoring, real-time system monitoring, RBAC,
simulation-based demo capability)

---

CHAPTER 2: LITERATURE REVIEW

2.1 Introduction
Standard framing paragraph about reviewing existing cybersecurity/
SIEM/anomaly-detection research

2.2 Reviewed Literature
Write 5 literature review entries in the EXACT same format as the
reference document (Paper [N]: Title, Link placeholder,
author-attributed paragraph summarizing a fictional/representative
paper on: (1) ML-based intrusion detection, (2) Isolation Forest
for anomaly detection, (3) SIEM systems and real-time monitoring,
(4) Random Forest classification for attack-type detection,
(5) survey of ML techniques in cybersecurity)

IMPORTANT: Use placeholder links like "[INSERT REAL PAPER LINK]"
since I will need to find and verify real papers to cite - do not
fabricate fake URLs or fake author names presented as real citations.

2.3 Summary
Standard literature review summary paragraph identifying gaps
(lack of real-time detection, lack of explainability, lack of
integrated system health monitoring) that SecureWatch AI addresses

---

CHAPTER 3: PROJECT DESIGN

For EACH of the following, write a 1-2 paragraph description (NOT
the diagram itself) followed by a placeholder heading:

3.1 ER Diagram
Describe entities from SCHEMA.md (Users, Alerts, Rules, RuleHits,
MLResults, AuditLogs, BlockedIPs, Settings) and their relationships
[INSERT DIAGRAM: Entity-Relationship Diagram]

3.2 Use Case Diagram
Describe actors (Admin, Analyst, Viewer) and their use cases from
APPFLOW.md
[INSERT DIAGRAM: Use Case Diagram]

3.3 Sequence Diagram
Describe the login-to-dashboard flow, or the log-to-alert ML
pipeline flow, from APPFLOW.md
[INSERT DIAGRAM: Sequence Diagram - Authentication Flow]
[INSERT DIAGRAM: Sequence Diagram - ML Detection Pipeline]

3.4 Activity Diagram
Describe the overall user journey from login through threat
detection and response
[INSERT DIAGRAM: Activity Diagram]

3.5 Data Flow Diagram
Describe data flow from log generation through feature extraction,
ML scoring, alert creation, to dashboard display (from
ARCHITECTURE.md)
[INSERT DIAGRAM: Data Flow Diagram]

3.6 System Architecture
Write a detailed paragraph description based on ARCHITECTURE.md's
system overview (Frontend/Backend/Database/ML layers), then:
[INSERT DIAGRAM: System Architecture Diagram]

---

CHAPTER 4: ADVANTAGES, LIMITATIONS & APPLICATION

4.1 Advantages (bulleted, based on PRD.md features)
4.2 Limitations (be honest - based on what you know from tonight's
conversation: single-machine deployment, simulated attack data
rather than live network capture, no real ELK pipeline, requires
manual simulation trigger for demo purposes)
4.3 Application (educational institutions for security training,
small business monitoring, academic demonstration of ML in
cybersecurity)

---

CHAPTER 5: IMPLEMENTATION

5.1 Training Data Generation (equivalent of "Dataset Collection")
Describe the synthetic training data approach from TRD.md/
SCHEMA.md's ML section: 50,000 normal samples, 600 labelled attack
samples across 6 classes
[INSERT CODE SNIPPET: generate_training_data.py]
[INSERT OUTPUT SCREENSHOT: Training Data Generation Console Output]

5.2 Feature Extraction (equivalent of "Data Preprocessing")
Describe the 12-feature extraction pipeline from SCHEMA.md
[INSERT CODE SNIPPET: feature_extraction.py]

5.3 Model Training
Describe Isolation Forest + Random Forest training process,
parameters (n_estimators=100, contamination=0.05), from TRD.md
[INSERT CODE SNIPPET: train_isolation_forest.py]
[INSERT CODE SNIPPET: train_rf_classifier.py]
[INSERT OUTPUT SCREENSHOT: Model Training Results]

5.4 Model Saving and Integration
Describe joblib serialization and predict.py's score_event()
pipeline integration
[INSERT CODE SNIPPET: predict.py score_event function]

5.5 Application Deployment
Describe the Docker-based deployment (PostgreSQL, backend,
frontend), mention this runs locally without requiring internet
connectivity for the ML inference (similar framing to reference
document's offline capability claim, but ONLY if this is
technically accurate per your Docker setup - otherwise, state that
the ML inference runs locally while requiring the local database
and API services)

---

CHAPTER 6: TESTING THE MODEL

6.1 Testing on Unseen Data
Describe the train/test split methodology (80/20) and actual
results (mention the RF classifier's reported accuracy from your
actual training run tonight, and note if 100% accuracy suggests
possible overfitting on synthetic data - be honest/academic about
this limitation rather than only presenting it as a strength)

6.2 Performance Evaluation Metrics
Describe accuracy, classification report (precision/recall/
f1-score), confusion matrix concepts as applied to the 6-class
attack classification

---

CHAPTER 7: GRAPHICAL USER INTERFACE

7.1 Overview
List all pages: Login, Signup, Dashboard, Live Logs, Alerts, Geo
Map, ML Engine, Anomalies, Trends, Rules, Settings, Admin, System
Health (13 pages total)

For EACH major page (7.2 through 7.14, one subsection per page),
write:

- A short paragraph describing its purpose (pull from UIUX.md/
  PRD.md page specifications)
- [INSERT SCREENSHOT: PageName Interface]
- If relevant, a brief code reference placeholder:
  [INSERT CODE SNIPPET: PageName.jsx key logic]

Cover these pages as subsections:
7.2 Login Page Interface
7.3 Signup Page Interface  
7.4 Dashboard Interface
7.5 Live Logs Interface
7.6 Alerts Management Interface
7.7 Geo Map Interface
7.8 ML Engine Interface
7.9 Anomalies Interface
7.10 Trends Interface
7.11 Rules Management Interface
7.12 Settings Interface
7.13 Admin/My Account Interface
7.14 System Health Interface

---

CHAPTER 8: TESTING

Write test cases in the EXACT Description/Expected Result/Actual
Result/Status format from the reference document. Base these on
REAL testing that was actually performed (per project context):

8.1 Test Case: Valid Login Authentication
8.2 Test Case: Invalid Credentials Rejection  
8.3 Test Case: JWT Token Expiry and Session Handling
8.4 Test Case: Role-Based Access Control (Analyst blocked from Settings)
8.5 Test Case: ML Anomaly Detection - Attack Event Classification
8.6 Test Case: ML Normal Event - No False Alert
8.7 Test Case: Alert Status Update (Investigate/Resolve workflow)
8.8 Test Case: Rules CRUD Operations
8.9 Test Case: Real-Time System Metrics Accuracy
8.10 Test Case: Backend API Test Suite (26 automated tests)

For each, write realistic Actual Result text - since this project
genuinely had 26/26 passing automated tests (pytest), reflect that
real achievement accurately, and for any UI-level bugs discovered
during testing, you may note "Issue identified and resolved during
testing" as academically honest testing documentation (this
happened multiple times tonight and is genuinely good academic
content to describe as part of the development/testing process)

---

CHAPTER 9: CONCLUSION

9.1 Summary of Achievements
Bulleted list reflecting REAL achievements: FastAPI backend with
JWT+RBAC, PostgreSQL with 8 relational tables, trained ML pipeline
(Isolation Forest + Random Forest), React frontend with 13 pages,
real-time system monitoring via psutil, Docker containerization,
26 automated backend tests

9.2 Future Work
Based on genuine architectural decisions made during this project
(from ARCHITECTURE.md's documented production path): integration
with real Filebeat/Logstash/Elasticsearch pipeline for live log
ingestion, expansion to real network traffic capture, cloud
deployment, mobile application, multi-tenant support

9.3 Advantages
Bulleted, same style as reference

9.4 Disadvantages
Bulleted, BE HONEST per what you know of this project: reliance
on simulated attack data rather than live network capture,
single-machine deployment scope, requires further tuning to avoid
ML overfitting risk on synthetic training data, no real ELK
pipeline integration yet

---

CHAPTER 10: BIBLIOGRAPHY / REFERENCE

Write 8-10 references in the same academic citation format as the
reference document, covering:

- scikit-learn documentation
- FastAPI documentation
- React documentation
- PostgreSQL documentation
- A book on machine learning (e.g. Géron's Hands-On Machine
  Learning, same as reference document cites)
- A book on cybersecurity/intrusion detection fundamentals
- Isolation Forest original paper (Liu, Ting, Zhou - this is a
  real, correctly citable paper, use its real title "Isolation
  Forest" and note it was published at ICDM 2008)
- Random Forest original paper (Breiman, 2001, "Random Forests",
  Machine Learning journal - also real and correctly citable)

---

FORMATTING RULES:

- Match the reference document's academic tone throughout - formal,
  third person, past tense for completed work
- Use "SecureWatch AI" consistently as the project name throughout
  (not any other name)
- Every technical claim must trace back to one of the 8 pasted
  project documents - do not invent features, API endpoints, or
  architecture details not present in those files
- Placeholder headings for images/diagrams/code must use the exact
  format: [INSERT SCREENSHOT: description] or
  [INSERT DIAGRAM: description] or [INSERT CODE SNIPPET: description]
- Keep chapter/section numbering exactly matching the reference
  document's numbering scheme
- Write the FULL document, not an outline - I need complete prose
  for every section, only images/code/diagrams are placeholders

Begin writing the complete black book now, chapter by chapter.
