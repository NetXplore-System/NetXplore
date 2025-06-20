# NetXplore

**NetXplore** is a web-based research platform for analyzing, visualizing, and comparing discourse networks across platforms like **WhatsApp** and **Wikipedia**.

This tool transforms linear conversations into interactive network graphs, enabling deep analysis of social structures, communication patterns, and key metrics.

---

## Features

* Upload chat or discussion exports (WhatsApp `.txt` or Wikipedia `.json`)
* Build and visualize communication networks
* Perform community detection and network analysis
* Calculate centrality metrics:
  * Degree Centrality
  * Betweenness Centrality
  * Closeness Centrality
* Apply advanced filters:
  * By date range
  * By keywords
  * By selected users
  * By minimum message length or activity
* Compare discourse across different groups
* Save and manage research history
* Export results as Excel/CSV
* Support for dual platforms: **WhatsApp** and **Wikipedia**
* Anonymize participant names for privacy

---

## Tech Stack

* **Frontend:** React, Bootstrap (hosted on AWS S3)
* **Backend:** FastAPI (Python)
* **Database:** PostgreSQL (via pgAdmin)
* **Graph Analysis:** NetworkX, custom SNA algorithms
* **Deployment:** AWS EC2 (Backend), S3 (Frontend), Nginx (reverse proxy)

---

##  Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/netxplore.git
cd netxplore
```

---

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

####  Create a `.env` file in the `backend/` directory:

```env
JWT_SECRET=your_jwt_secret
MONGO_URI=your_mongodb_uri
POSTGRES_URL=your_postgres_url
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

#### Start the Backend Server

```bash
uvicorn main:app --reload
```

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

####  Create a `.env` file in the `frontend/` directory:

```env
REACT_APP_API_URL=http://localhost:8000
```

#### Start the Frontend App

```bash
npm start
```

---

### Access the App

* Frontend: [http://localhost:3000](http://localhost:3000)
* Backend API: [http://localhost:8000](http://localhost:8000)
