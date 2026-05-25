<div align="center">

# 🛡️ PrintFlow - Secure Admin Portal

<a href="https://readme-typing-svg.herokuapp.com">
  <img src="https://readme-typing-svg.herokuapp.com/?lines=PrintFlow+-+Secure+Admin+Portal;Strict+Access+Control;Manage+Disputes+&+Verification&font=Inter&center=true&width=550&height=50&color=DC2626&vCenter=true&size=22" alt="Typing SVG" />
</a>

<p align="center">
  <img src="https://skillicons.dev/icons?i=react,tailwind&theme=dark" alt="React & Tailwind" />
</p>

> [!CAUTION]
> **RESTRICTED ENVIRONMENT**
> This environment is protected by strict 2FA (TOTP) and Role-Based Access Control (RBAC). Unauthorized access is strictly prohibited.

</div>

<br />

## 📖 Context
This repository houses the secure, React-based dashboard used by PrintFlow system administrators. It is utilized to manage shop verification requests, review AI-generated compliance suggestions, and arbitrate student and shop payment disputes.

---

## 🔐 Key Workflows

<details>
<summary><b>1. Shop Verification (AI Assisted)</b></summary>
<br/>
Administrators review onboarding requests from new campus print shops. The AI analyzes the submitted compliance documents and provides a risk score and recommendation. The admin has the final say on approving or rejecting the shop's application to join the PrintFlow network.
</details>

<details>
<summary><b>2. Dispute Escalation Arbiter</b></summary>
<br/>
When a shop rejects a student's payment receipt, the student can appeal. Administrators act as the final arbiter in the `ESCALATED_DISPUTE` state, reviewing the uploaded receipt and chat logs to either override the shop or enforce the rejection.
</details>

---

## 🚀 Setup Instructions

```bash
# 1. Clone and navigate to the admin repository
cd printflow-admin

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

> **Note:** The master admin account must be seeded directly in the backend PostgreSQL database before you can log in to this portal.

---

## 👥 Contributors
Proudly developed by the PrintFlow team:
- **Jude Mikael Valencia**
- **Karol Vincent Bebedor**
- **Noeh Arbee Boiser**
- **Aldrin Suse**
