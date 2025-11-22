import AuditLogContainer from "@/features/audit-log/containers/audit-log-container";

export default function AuditLogPage() {
	return (
		<div className="container mx-auto py-6">
			<h1 className="text-2xl font-bold mb-6">Audit Log</h1>
			<AuditLogContainer />
		</div>
	);
}
