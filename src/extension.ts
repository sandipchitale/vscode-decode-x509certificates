import * as vscode from 'vscode';
import { TextEditor } from 'vscode';
import { X509Certificate } from 'crypto';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerTextEditorCommand('vscode-decode-x509certificates.decode', decodeX509certificates));
}

async function decodeX509certificates(textEditor: TextEditor, edit: vscode.TextEditorEdit, ...args: any[]): Promise<void> {
	const documentText = textEditor.document.getText();
	if (documentText) {
		const bcecRegExp = /(.*?)(-----BEGIN CERTIFICATE-----.*?-----END CERTIFICATE-----)/gms;
		let content = '';
		let bcecMatches = bcecRegExp.exec(documentText);
		let lastIndex = 0;
		while (bcecMatches) {
			if (bcecMatches && bcecMatches.length > 2) {
				const prefix = bcecMatches[1];
				let certificate = bcecMatches[2];
				certificate = certificate
					.split(/\r?\n/)
					.filter(line => line.trim().length > 0)
					.join('\n');
				try {
					const x509Certificate = new X509Certificate(certificate);
					let formattedX509Certificate = `Subject: ${x509Certificate.subject}
Subject Alt Name:
	${x509Certificate.subjectAltName?.split(', ').join('\n\t\t')}
Issuer:
	${x509Certificate.issuer?.split('\n').join('\n\t\t')}
Infoaccess:
	${x509Certificate.infoAccess?.split('\n').join('\n\t\t')}
Validfrom: ${x509Certificate.validFrom}
Validto: ${x509Certificate.validTo}
Fingerprint: ${x509Certificate.fingerprint}
Fingerprint256: ${x509Certificate.fingerprint256}
Keyusage: ${x509Certificate.keyUsage}
Serialnumbe: ${x509Certificate.serialNumber}
`.trim();
					content = `${content}${prefix}---\nDecoded X509 Certificate:\n\n${formattedX509Certificate}\n\nX509 Certificate:\n\n${certificate}`;
				} catch (error) {
					console.error(error);
					content = `${content}${prefix}---\nDecoded X509 Certificate:\n\n${error}\n\nX509 Certificate:\n\n${certificate}`;
				}
			}
			lastIndex = bcecRegExp.lastIndex;
			bcecMatches = bcecRegExp.exec(documentText);
		}

		content = `${content}${documentText.substring(lastIndex)}`;
		const doc = await vscode.workspace.openTextDocument({
			content: `${content}`
		});
		await vscode.window.showTextDocument(doc, { preview: false });
		return;
	}
	vscode.window.showInformationMessage('No X509Certificates found in the current document.');
}

export function deactivate() { }
