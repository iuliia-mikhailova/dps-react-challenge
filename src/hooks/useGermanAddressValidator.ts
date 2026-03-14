import { useEffect, useMemo, useState } from 'react';
import type { LastEditedField, LocalityResult } from '../types/address';

const API_BASE_URL = 'https://openplzapi.org/de/Localities';
const DEBOUNCE_MS = 1000;

export function useGermanAddressValidator() {
	const [locality, setLocality] = useState('');
	const [postalCode, setPostalCode] = useState('');

	const [postalCodeOptions, setPostalCodeOptions] = useState<string[]>([]);
	const [isPostalDropdown, setIsPostalDropdown] = useState(false);

	const [error, setError] = useState<string | null>(null);
	const [isLoadingLocality, setIsLoadingLocality] = useState(false);
	const [isLoadingPostal, setIsLoadingPostal] = useState(false);
	const [lastEditedField, setLastEditedField] = useState<LastEditedField>(null);
	const [isLocked, setIsLocked] = useState(false);

	const hasActiveLookup = isLoadingLocality || isLoadingPostal;

	const uniqueSortedPostalCodes = useMemo(
		() => [...new Set(postalCodeOptions)].sort((a, b) => a.localeCompare(b)),
		[postalCodeOptions],
	);

	const handleLocalityChange = (value: string) => {
		if (isLocked) return;

		setLocality(value);
		setLastEditedField('locality');
		setError(null);

		setPostalCodeOptions([]);
		setIsPostalDropdown(false);
		if (!value.trim()) {
			setPostalCode('');
		}
	};

	const handlePostalCodeChange = (value: string) => {
		if (isLocked) return;

		setPostalCode(value);
		setLastEditedField('postalCode');
		setError(null);
		// Lock when user selects a PLZ from the dropdown (both fields are then valid)
		if (isPostalDropdown && value.trim()) {
			setIsLocked(true);
		}
	};

	useEffect(() => {
		if (lastEditedField !== 'locality') return;

		const trimmed = locality.trim();
		if (!trimmed) {
			setIsPostalDropdown(false);
			setPostalCodeOptions([]);
			return;
		}

		const timeoutId = window.setTimeout(async () => {
			try {
				setIsLoadingLocality(true);
				setError(null);

				const url = `${API_BASE_URL}?name=${encodeURIComponent(trimmed)}`;
				const response = await fetch(url);

				if (!response.ok) {
					throw new Error(`Request failed with status ${response.status}`);
				}

				const data = (await response.json()) as LocalityResult[];

				// #region agent log
				fetch('http://127.0.0.1:7792/ingest/25ab2644-8148-4897-99f9-75bcb385d073', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-Debug-Session-Id': '2a621b',
					},
					body: JSON.stringify({
						sessionId: '2a621b',
						runId: 'initial-locality',
						hypothesisId: 'H1',
						location: 'useGermanAddressValidator.ts:localityEffect',
						message: 'Locality lookup response',
						data: {
							url,
							isArray: Array.isArray(data),
							length: Array.isArray(data) ? data.length : null,
							sample: Array.isArray(data) && data.length > 0 ? data[0] : null,
						},
						timestamp: Date.now(),
					}),
				}).catch(() => {});
				// #endregion

				if (!Array.isArray(data) || data.length === 0) {
					setIsPostalDropdown(false);
					setPostalCodeOptions([]);
					setPostalCode('');
					setError('No postal codes found for this locality.');
					return;
				}

				const postalCodes = data.map((item) => item.postalCode).filter(Boolean);
				const uniquePostalCodes = [...new Set(postalCodes)];

				// #region agent log
				fetch('http://127.0.0.1:7792/ingest/25ab2644-8148-4897-99f9-75bcb385d073', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-Debug-Session-Id': '2a621b',
					},
					body: JSON.stringify({
						sessionId: '2a621b',
						runId: 'initial-locality',
						hypothesisId: 'H2',
						location: 'useGermanAddressValidator.ts:localityEffect',
						message: 'Derived postal code list from locality lookup',
						data: {
							rawCount: Array.isArray(data) ? data.length : null,
							postalCodesLength: postalCodes.length,
							uniquePostalCodesLength: uniquePostalCodes.length,
							firstPostalCode: postalCodes[0] ?? null,
						},
						timestamp: Date.now(),
					}),
				}).catch(() => {});
				// #endregion

				if (uniquePostalCodes.length === 1) {
					setPostalCode(uniquePostalCodes[0]);
					setIsPostalDropdown(false);
					setPostalCodeOptions([]);
					setIsLocked(true);
				} else {
					setPostalCodeOptions(uniquePostalCodes);
					setIsPostalDropdown(true);

					if (!uniquePostalCodes.includes(postalCode)) {
						setPostalCode('');
					}
				}
			} catch {
				setError('There was a problem looking up postal codes. Please try again.');
			} finally {
				setIsLoadingLocality(false);
			}
		}, DEBOUNCE_MS);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [locality, lastEditedField, postalCode]);

	useEffect(() => {
		if (lastEditedField !== 'postalCode') return;

		const trimmed = postalCode.trim();
		if (!trimmed) {
			setLocality('');
			return;
		}

		const isFiveDigitNumber = /^\d{5}$/.test(trimmed);
		if (!isFiveDigitNumber) {
			setError('Please enter a valid 5-digit German postal code.');
			return;
		}

		const timeoutId = window.setTimeout(async () => {
			try {
				setIsLoadingPostal(true);
				setError(null);

				const url = `${API_BASE_URL}?postalCode=${encodeURIComponent(trimmed)}`;
				const response = await fetch(url);

				if (!response.ok) {
					throw new Error(`Request failed with status ${response.status}`);
				}

				const data = (await response.json()) as LocalityResult[];

				// #region agent log
				fetch('http://127.0.0.1:7792/ingest/25ab2644-8148-4897-99f9-75bcb385d073', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-Debug-Session-Id': '2a621b',
					},
					body: JSON.stringify({
						sessionId: '2a621b',
						runId: 'initial-postal',
						hypothesisId: 'P1',
						location: 'useGermanAddressValidator.ts:postalEffect',
						message: 'Postal code lookup response',
						data: {
							url,
							isArray: Array.isArray(data),
							length: Array.isArray(data) ? data.length : null,
							sample: Array.isArray(data) && data.length > 0 ? data[0] : null,
							currentLocality: locality,
							currentPostalCode: postalCode,
						},
						timestamp: Date.now(),
					}),
				}).catch(() => {});
				// #endregion

				if (!Array.isArray(data) || data.length === 0) {
					// #region agent log
					fetch('http://127.0.0.1:7792/ingest/25ab2644-8148-4897-99f9-75bcb385d073', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'X-Debug-Session-Id': '2a621b',
						},
						body: JSON.stringify({
							sessionId: '2a621b',
							runId: 'initial-postal',
							hypothesisId: 'P2',
							location: 'useGermanAddressValidator.ts:postalEffect',
							message: 'Postal code lookup returned no results',
							data: {
								currentLocalityBeforeClearAttempt: locality,
								currentPostalCode,
							},
							timestamp: Date.now(),
						}),
					}).catch(() => {});
					// #endregion

					setLocality('');
					setError('This postal code is not valid in Germany.');
					return;
				}

				const localityNames = data.map((item) => item.name).filter(Boolean);
				const uniqueLocalities = [...new Set(localityNames)];

				setLocality(uniqueLocalities.join(', '));
				setIsLocked(true);
			} catch {
				setError('There was a problem validating the postal code. Please try again.');
			} finally {
				setIsLoadingPostal(false);
			}
		}, DEBOUNCE_MS);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [postalCode, lastEditedField]);

	const clear = () => {
		setLocality('');
		setPostalCode('');
		setPostalCodeOptions([]);
		setIsPostalDropdown(false);
		setError(null);
		setIsLocked(false);
		setLastEditedField(null);
	};

	return {
		locality,
		postalCode,
		isPostalDropdown,
		uniqueSortedPostalCodes,
		error,
		hasActiveLookup,
		isLocked,
		handleLocalityChange,
		handlePostalCodeChange,
		clear,
	};
}

