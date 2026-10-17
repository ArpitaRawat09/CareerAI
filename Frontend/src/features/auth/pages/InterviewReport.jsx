import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../dashBoard.scss";
import "../interview.scss";
import "../interviewReport.scss";

const getStoredReport = () => {
	try {
		const storedReport = sessionStorage.getItem("careerai:last-report");
		return storedReport ? JSON.parse(storedReport) : null;
	} catch {
		return null;
	}
};

const InterviewReport = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const { user, handleLogout } = useAuth();
	const report = location.state?.report || getStoredReport();

	useEffect(() => {
		if (!report) {
			navigate("/interview", { replace: true });
		}
	}, [navigate, report]);

	if (!report) return null;

	const handleSignOut = async () => {
		await handleLogout();
		navigate("/login");
	};

	const displayName = user?.username || user?.email?.split("@")[0] || "there";
	const initials = displayName.slice(0, 2).toUpperCase();
	const technicalQuestions = report.technicalQuestions || [];
	const behavioralQuestions = report.behavioralQuestions || [];
	const skillGaps = report.skillGaps || [];
	const preparationPlan = report.preparationPlan || [];

	return (
		<div className="report-page">
			<header className="report-page__header">
				<Link className="interview-page__brand" to="/"><span className="brand-mark__icon">C</span> CareerAI</Link>
				<div className="interview-page__actions"><div className="profile-chip"><span className="profile-chip__avatar">{initials}</span><span className="profile-chip__details"><strong>{displayName}</strong><small>Active candidate</small></span></div><button type="button" onClick={handleSignOut}>Sign out</button></div>
			</header>

			<main className="report-page__content">
				<div className="report-page__topline"><Link className="interview-page__back" to="/interview">&#8592; New interview</Link><span className="report-page__status">Report generated</span></div>
				<section className="report-hero">
					<div><p className="section-kicker">Interview report</p><h1>{report.title || "Your interview preparation plan"}</h1><p>Here is your tailored preparation guide based on your resume and target role.</p></div>
					<div className="match-score"><strong>{report.matchScore ?? "--"}</strong><span>/ 100 match</span></div>
				</section>

				<section className="report-section">
					<div className="report-section__heading"><p className="section-kicker">Focus areas</p><h2>Skills to strengthen</h2></div>
					{skillGaps.length > 0 ? <div className="skill-list">{skillGaps.map((gap) => <article className="skill-item" key={gap.skill}><span>{gap.skill}</span><b className={`severity severity--${gap.severity}`}>{gap.severity}</b></article>)}</div> : <p className="report-empty">No major skill gaps were identified.</p>}
				</section>

				<div className="report-columns">
					<section className="report-section">
						<div className="report-section__heading"><p className="section-kicker">Technical round</p><h2>Questions to rehearse</h2></div>
						<div className="question-list">{technicalQuestions.map((item, index) => <article className="question-item" key={`${item.question}-${index}`}><span className="question-item__number">{String(index + 1).padStart(2, "0")}</span><div><h3>{item.question}</h3><p><strong>What they are looking for:</strong> {item.intention}</p><p><strong>Answer approach:</strong> {item.answer}</p></div></article>)}</div>
					</section>

					<section className="report-section">
						<div className="report-section__heading"><p className="section-kicker">Behavioral round</p><h2>Stories to prepare</h2></div>
						<div className="question-list">{behavioralQuestions.map((item, index) => <article className="question-item" key={`${item.question}-${index}`}><span className="question-item__number">{String(index + 1).padStart(2, "0")}</span><div><h3>{item.question}</h3><p><strong>What they are looking for:</strong> {item.intention}</p><p><strong>Answer approach:</strong> {item.answer}</p></div></article>)}</div>
					</section>
				</div>

				<section className="report-section preparation-section">
					<div className="report-section__heading"><p className="section-kicker">Your roadmap</p><h2>Preparation plan</h2></div>
					<div className="plan-list">{preparationPlan.map((day) => <article className="plan-day" key={day.day}><span className="plan-day__number">Day {day.day}</span><div><h3>{day.focus}</h3><ul>{(day.tasks || []).map((task) => <li key={task}>{task}</li>)}</ul></div></article>)}</div>
				</section>
			</main>
		</div>
	);
};

export default InterviewReport;


