import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import "../../auth/dashBoard.scss";
import "../styles/interview.scss";

const initialForm = { selfDescription: "", jobDescription: "" };
const MAX_RESUME_SIZE = 3 * 1024 * 1024;

const Interview = () => {
	const navigate = useNavigate();
	const { user, handleLogout } = useAuth();
	const [form, setForm] = useState(initialForm);
	const [resume, setResume] = useState(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [report, setReport] = useState(null);

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
			sessionStorage.setItem("careerai:last-report", JSON.stringify(response.data.data));
			navigate("/interview/report", { state: { report: response.data.data } });
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

	const handleResumeChange = (event) => {
		const selectedResume = event.target.files?.[0] || null;
		if (selectedResume && selectedResume.size > MAX_RESUME_SIZE) {
			setResume(null);
			setError("Your resume must be 3MB or smaller.");
			event.target.value = "";
			return;
		}

		setError("");
		setResume(selectedResume);
	};

	const displayName = user?.username || user?.email?.split("@")[0] || "there";
	const initials = displayName.slice(0, 2).toUpperCase();

	return (
		<div className="interview-page">
			<header className="interview-page__header">
				<Link className="interview-page__brand" to="/"><span className="brand-mark__icon">C</span> CareerAI</Link>
				<div className="interview-page__actions">
					<div className="profile-chip"><span className="profile-chip__avatar">{initials}</span><span className="profile-chip__details"><strong>{displayName}</strong><small>Active candidate</small></span></div>
					<button type="button" onClick={handleSignOut}>Sign out</button>
				</div>
			</header>

			<main className="interview-page__content">
				<Link className="interview-page__back" to="/">&#8592; Back to dashboard</Link>
				<section className="interview-intro">
					<p className="section-kicker">New interview</p>
					<h1>Build a sharper preparation plan.</h1>
					<p>Give CareerAI the context for your next role. We will turn it into focused questions and a practical plan for your interview.</p>
				</section>

				<section className="workspace-card interview-page__card">
					<div className="card-heading"><div><p className="section-kicker">Step 01</p><h2>Tell us about the role</h2></div><span className="step-count">1 / 1</span></div>
					<form className="interview-form" onSubmit={handleSubmit}>
						<label className="resume-dropzone" htmlFor="interview-resume"><span className="resume-dropzone__icon" aria-hidden="true">&#8593;</span><span><strong>{resume ? resume.name : "Upload your resume"}</strong><small>{resume ? "Ready to analyze" : "PDF format, up to 3MB"}</small></span><span className="resume-dropzone__action">Browse</span><input id="interview-resume" type="file" accept="application/pdf" onChange={handleResumeChange} /></label>
						<label className="field-label" htmlFor="interview-self-description">Tell us about yourself <span>Optional</span></label>
						<textarea id="interview-self-description" name="selfDescription" value={form.selfDescription} onChange={updateField} placeholder="A quick summary of your experience, strengths, or goals" rows="4" />
						<label className="field-label" htmlFor="interview-job-description">Job description</label>
						<textarea id="interview-job-description" name="jobDescription" value={form.jobDescription} onChange={updateField} placeholder="Paste the role description you are preparing for" rows="8" required />
						{error && <p className="form-message form-message--error" role="alert">{error}</p>}
						{report && <p className="form-message form-message--success" role="status">Your report is ready. Match score: {report.matchScore ?? "Pending"}%</p>}
						<button className="button primary-button interview-form__submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Generating report..." : "Generate interview report"}<span aria-hidden="true">&#8594;</span></button>
					</form>
				</section>
			</main>
		</div>
	);
};

export default Interview;