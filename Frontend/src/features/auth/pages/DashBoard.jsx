import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../dashBoard.scss";

const initialForm = { selfDescription: "", jobDescription: "" };

const Dashboard = () => {
	const navigate = useNavigate();
	const { user, handleLogout } = useAuth();
	const [form, setForm] = useState(initialForm);
	const [resume, setResume] = useState(null);
	const [report, setReport] = useState(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");

	const updateField = (event) => {
		setForm((currentForm) => ({ ...currentForm, [event.target.name]: event.target.value }));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (!resume) {
			setError("Please attach your resume to continue.");
			return;
		}
		setError("");
		setReport(null);
		setIsSubmitting(true);
		const payload = new FormData();
		payload.append("resume", resume);
		payload.append("selfDescription", form.selfDescription);
		payload.append("jobDescription", form.jobDescription);

		try {
			const response = await axios.post("http://localhost:3000/api/interview", payload, { withCredentials: true });
			setReport(response.data.data);
		} catch (requestError) {
			setError(requestError.response?.data?.message || "We could not generate your report. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleSignOut = async () => {
		await handleLogout();
		navigate("/login");
	};

	const displayName = user?.username || user?.email?.split("@")[0] || "there";
	const initials = displayName.slice(0, 2).toUpperCase();

	return (
		<div className="dashboard-shell">
			<aside className="dashboard-sidebar">
				<div className="brand-mark" aria-label="CareerAI home"><span className="brand-mark__icon">C</span><span>CareerAI</span></div>
				<nav className="dashboard-nav" aria-label="Dashboard navigation">
					<a className="dashboard-nav__link dashboard-nav__link--active" href="#overview"><span aria-hidden="true">&#9632;</span> Overview</a>
					<a className="dashboard-nav__link" href="/interview"><span aria-hidden="true">+</span> New interview</a>
					<div className="dashboard-nav__section">
						<span className="dashboard-nav__label">Your library</span>
						<a className="dashboard-nav__link" href="/interview/report"><span aria-hidden="true">&#9776;</span> Interview reports</a>
					</div>
				</nav>
				<div className="sidebar-note"><span className="sidebar-note__eyebrow">Your next step</span><strong>Turn your experience into a sharper interview.</strong><a href="#new-interview">Start preparing <span aria-hidden="true">&#8594;</span></a></div>
				<button className="sidebar-signout" type="button" onClick={handleSignOut}><span aria-hidden="true">&#8592;</span> Sign out</button>
			</aside>

			<div className="dashboard-main">
				<header className="dashboard-header">
					<div><p className="dashboard-header__eyebrow">Candidate workspace</p><h1>Hello, {displayName}.</h1></div>
					<div className="profile-chip"><span className="profile-chip__avatar">{initials}</span><span className="profile-chip__details"><strong>{displayName}</strong><small>Active candidate</small></span></div>
				</header>

				<main id="overview" className="dashboard-content">
					<section className="welcome-panel"><div><p className="section-kicker">Your preparation hub</p><h2>Make your next interview feel familiar.</h2><p>Upload your resume and a target role to get tailored technical questions, behavioral prompts, and a focused preparation plan.</p></div><div className="welcome-panel__signal" aria-hidden="true"><span>AI</span><i></i><i></i><i></i></div></section>

					<div className="dashboard-grid">
						<section id="new-interview" className="workspace-card">
							<div className="card-heading"><div><p className="section-kicker">Build a report</p><h2>Prepare for a role</h2></div><span className="step-count">01 / 01</span></div>
							<form className="interview-form" onSubmit={handleSubmit}>
								<label className="resume-dropzone" htmlFor="resume"><span className="resume-dropzone__icon" aria-hidden="true">&#8593;</span><span><strong>{resume ? resume.name : "Upload your resume"}</strong><small>{resume ? "Ready to analyze" : "PDF format, up to 10MB"}</small></span><span className="resume-dropzone__action">Browse</span><input id="resume" type="file" accept="application/pdf" onChange={(event) => setResume(event.target.files?.[0] || null)} /></label>
								<label className="field-label" htmlFor="selfDescription">Tell us about yourself <span>Optional</span></label>
								<textarea id="selfDescription" name="selfDescription" value={form.selfDescription} onChange={updateField} placeholder="A quick summary of your experience, strengths, or goals" rows="3" />
								<label className="field-label" htmlFor="jobDescription">Job description</label>
								<textarea id="jobDescription" name="jobDescription" value={form.jobDescription} onChange={updateField} placeholder="Paste the role description you are preparing for" rows="5" required />
								{error && <p className="form-message form-message--error" role="alert">{error}</p>}
								{report && <p className="form-message form-message--success" role="status">Your report is ready. Match score: {report.matchScore ?? "Pending"}%</p>}
								<button className="button primary-button interview-form__submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Generating report..." : "Generate interview report"} <span aria-hidden="true">&#8594;</span></button>
							</form>
						</section>
					</div>
				</main>
			</div>
		</div>
	);
};

export default Dashboard;
