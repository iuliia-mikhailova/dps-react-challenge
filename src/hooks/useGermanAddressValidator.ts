import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LastEditedField, LocalityResult } from '../types/address';

const API_BASE_URL = 'https://openplzapi.org/de/Localities';
const DEBOUNCE_MS = 1000;

export function useGermanAddressValidator() {
	const [locality, setLocality] = useState('');
	const [postalCode, setPostalCode] = useState('');

	const [postalCodeOptions, setPostalCodeOptions] = useState<string[]>([]);
	const [isPostalDropdown, setIsPostalDropdown] = useState(false);

	const [localitySuggestions, setLocalitySuggestions] = useState<LocalityResult[]>([]);
	const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

	const [error, setError] = useState<string | null>(null);
	const [errorSource, setErrorSource] = useState<'locality' | 'postal' | null>(null);
	const [isLoadingLocality, setIsLoadingLocality] = useState(false);
	const [isLoadingPostal, setIsLoadingPostal] = useState(false);
	const [lastEditedField, setLastEditedField] = useState<LastEditedField>(null);
	const [isLocked, setIsLocked] = useState(false);

	const localityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const hasActiveLookup = isLoadingLocality || isLoadingPostal;

	const uniqueSortedPostalCodes = useMemo(
		() => [...new Set(postalCodeOptions)].sort((a, b) => a.localeCompare(b)),
		[postalCodeOptions],
	);

	const fetchLocalitySuggestions = useCallback(async (query: string) => {
		const trimmed = query.trim();
		if (!trimmed) {
			setLocalitySuggestions([]);
			setIsSuggestionsOpen(false);
			return;
		}
		try {
			setIsLoadingLocality(true);
			setError(null);
			setErrorSource(null);
			const url = `${API_BASE_URL}?name=${encodeURIComponent(trimmed)}`;
			const response = await fetch(url);
			if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
			const data = (await response.json()) as LocalityResult[];
			if (!Array.isArray(data) || data.length === 0) {
				setLocalitySuggestions([]);
				setIsSuggestionsOpen(false);
				setError('No postal codes found for this locality.');
				setErrorSource('locality');
				return;
			}
			setLocalitySuggestions(data);
			setIsSuggestionsOpen(true);
		} catch {
			setError('There was a problem looking up postal codes. Please try again.');
			setErrorSource('locality');
			setLocalitySuggestions([]);
			setIsSuggestionsOpen(false);
		} finally {
			setIsLoadingLocality(false);
		}
	}, []);

	const handleLocalityChange = (value: string) => {
		if (isLocked) return;

		setLocality(value);
		setLastEditedField('locality');
		setError(null);
		setErrorSource(null);
		setPostalCodeOptions([]);
		setIsPostalDropdown(false);
		if (!value.trim()) {
			setPostalCode('');
			setLocalitySuggestions([]);
			setIsSuggestionsOpen(false);
		}
	};

	const handleLocalityKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key !== 'Enter') return;
			e.preventDefault();
			if (localityDebounceRef.current) {
				clearTimeout(localityDebounceRef.current);
				localityDebounceRef.current = null;
			}
			fetchLocalitySuggestions(locality);
		},
		[locality, fetchLocalitySuggestions],
	);

	const selectLocalitySuggestion = useCallback(
		(selectedName: string) => {
			const matches = localitySuggestions.filter((r) => r.name === selectedName);
			if (matches.length === 0) return;

			const uniquePlz = [...new Set(matches.map((r) => r.postalCode).filter(Boolean))];

			setLocality(selectedName);
			setLocalitySuggestions([]);
			setIsSuggestionsOpen(false);
			setLastEditedField(null);
			setError(null);
			setErrorSource(null);

			if (uniquePlz.length === 1) {
				setPostalCode(uniquePlz[0]);
				setIsPostalDropdown(false);
				setPostalCodeOptions([]);
				setIsLocked(true);
			} else {
				setPostalCodeOptions(uniquePlz.sort((a, b) => a.localeCompare(b)));
				setIsPostalDropdown(true);
				setPostalCode('');
			}
		},
		[localitySuggestions],
	);

	const closeSuggestions = useCallback(() => {
		setIsSuggestionsOpen(false);
	}, []);

	const handlePostalCodeChange = (value: string) => {
		if (isLocked) return;

		setPostalCode(value);
		setLastEditedField('postalCode');
		setError(null);
		setErrorSource(null);
		if (isPostalDropdown && value.trim()) {
			setIsLocked(true);
		}
	};

	useEffect(() => {
		if (lastEditedField !== 'locality') return;

		const trimmed = locality.trim();
		if (!trimmed) {
			setLocalitySuggestions([]);
			setIsSuggestionsOpen(false);
			return;
		}

		localityDebounceRef.current = window.setTimeout(() => {
			localityDebounceRef.current = null;
			fetchLocalitySuggestions(locality);
		}, DEBOUNCE_MS);

		return () => {
			if (localityDebounceRef.current) {
				clearTimeout(localityDebounceRef.current);
				localityDebounceRef.current = null;
			}
		};
	}, [locality, lastEditedField, fetchLocalitySuggestions]);

	useEffect(() => {
		if (lastEditedField !== 'postalCode') return;

		const trimmed = postalCode.trim();
		if (!trimmed) {
			setLocality('');
			setError(null);
			setErrorSource(null);
			return;
		}

		const timeoutId = window.setTimeout(async () => {
			const currentTrimmed = postalCode.trim();
			if (!currentTrimmed) return;

			const isFiveDigitNumber = /^\d{5}$/.test(currentTrimmed);
			if (!isFiveDigitNumber) {
				setError('Please enter a valid 5-digit German postal code.');
				setErrorSource('postal');
				return;
			}

			try {
				setIsLoadingPostal(true);
				setError(null);
				setErrorSource(null);

				const url = `${API_BASE_URL}?postalCode=${encodeURIComponent(currentTrimmed)}`;
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
								currentPostalCode: postalCode,
							},
							timestamp: Date.now(),
						}),
					}).catch(() => {});
					// #endregion

					setLocality('');
					setError('This postal code is not valid in Germany.');
					setErrorSource('postal');
					return;
				}

				const localityNames = data.map((item) => item.name).filter(Boolean);
				const uniqueLocalities = [...new Set(localityNames)];

				setLocality(uniqueLocalities.join(', '));
				setIsLocked(true);
			} catch {
				setError('There was a problem validating the postal code. Please try again.');
				setErrorSource('postal');
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
		setLocalitySuggestions([]);
		setIsSuggestionsOpen(false);
		setError(null);
		setErrorSource(null);
		setIsLocked(false);
		setLastEditedField(null);
	};

	const uniqueLocalityNames = useMemo(() => {
		const names = [...new Set(localitySuggestions.map((r) => r.name).filter(Boolean))];
		const q = locality.trim().toLowerCase();
		if (!q) return names.sort((a, b) => a.localeCompare(b));
		return names.sort((a, b) => {
			const aLower = a.toLowerCase();
			const bLower = b.toLowerCase();
			const aStarts = aLower.startsWith(q);
			const bStarts = bLower.startsWith(q);
			if (aStarts && !bStarts) return -1;
			if (!aStarts && bStarts) return 1;
			const aContains = aLower.includes(q);
			const bContains = bLower.includes(q);
			if (aContains && !bContains) return -1;
			if (!aContains && bContains) return 1;
			return a.localeCompare(b);
		});
	}, [localitySuggestions, locality]);

	return {
		locality,
		postalCode,
		isPostalDropdown,
		uniqueSortedPostalCodes,
		error,
		errorSource,
		hasActiveLookup,
		isLocked,
		localitySuggestions,
		uniqueLocalityNames,
		isSuggestionsOpen,
		handleLocalityChange,
		handleLocalityKeyDown,
		handlePostalCodeChange,
		selectLocalitySuggestion,
		closeSuggestions,
		clear,
	};
}

