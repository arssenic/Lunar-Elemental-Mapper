import os
import numpy as np
import matplotlib.pyplot as plt
from astropy.io import fits
from scipy.signal import find_peaks
from scipy.optimize import curve_fit
from scipy.ndimage import gaussian_filter1d
import pandas as pd
from datetime import datetime, timedelta
from collections import defaultdict
import json



def Extract_data(spectrum_file):
    background_file = r"C:/Users/CSE IIT BHILAI/HP4/background_2020/background_month/output_2020_10.fits"
    k_alpha_lines = {
        8: 0.525,   # Oxygen
        11: 1.040,  # Sodium
        12: 1.253,  # Magnesium
        13: 1.486,  # Aluminum
        14: 1.739,  # Silicon
        20: 3.691,  # Calcium
        22: 4.510,  # Titanium
        26: 6.403   # Iron
    }

    def gaussian(x, A, mu, sigma):
        return A * np.exp(-0.5 * ((x - mu) / sigma) ** 2)
        
    def load_spectrum_data(fits_file, background_file=None):
        with fits.open(fits_file) as hdul:
            spectrum_data = hdul[1].data
            channels = spectrum_data['CHANNEL']
            counts = spectrum_data['COUNTS']
            time = hdul[1].header['EXPOSURE']
            
        energy = np.array([13.58 * (2048/len(channels)) * c / 1000 for c in channels])
        counts = np.array([c / time for c in counts])

        valid_indices = (channels >= 37) & (channels <= 250)
        channels = channels[valid_indices]
        energy = energy[valid_indices]
        counts = counts[valid_indices]

        if background_file:
            with fits.open(background_file) as bkg_hdul:
                background_data = bkg_hdul[1].data
            background_counts = background_data['MEAN_COUNTS'] 
            background_counts = background_counts[37:251]
            corrected_counts =counts - background_counts
        plt.plot(energy,corrected_counts)
        return energy, corrected_counts, counts, background_counts

    def identify_peaks(energy, counts, smoothing_sigma=2, prominence_factor=0.75):
        smoothed_counts = gaussian_filter1d(counts, sigma=smoothing_sigma)
        mean_count = np.mean(smoothed_counts)
        threshold = mean_count * prominence_factor
        
        peaks, _ = find_peaks(
            smoothed_counts, 
            height=threshold, 
            distance=10, 
            prominence=threshold*0.5
        )
        
        peaks_info = []
        
        for peak in peaks:
            window_size = 10
            start = max(0, peak - window_size)
            end = min(len(energy), peak + window_size)
            
            energy_window = energy[start:end]
            counts_window = smoothed_counts[start:end]
            
            initial_guess = [
                np.max(counts_window), 
                energy[peak], 
                0.1
            ]
            
            try:
                popt, _ = curve_fit(
                    gaussian, 
                    energy_window, 
                    counts_window, 
                    p0=initial_guess
                )
                
                A, mu, sigma = popt
                peaks_info.append((mu, sigma, A))
                
                fitted_curve = gaussian(energy_window, *popt)
                plt.plot(energy_window, fitted_curve, 
                         label=f'Peak at {mu:.2f} keV', 
                         linestyle='--')
                plt.axvline(mu, color='red', linestyle=':', alpha=0.7)
            
            except RuntimeError:
                print(f"Fitting failed for peak at {energy[peak]} keV")
        
        return peaks_info

    def match_peaks_to_elements(peaks_info, k_alpha_lines, tolerance=0.2):
        matched_elements = {}
        
        for peak_energy, peak_sigma, peak_amplitude in peaks_info:
            for atomic_num, k_alpha_energy in k_alpha_lines.items():
                if abs(peak_energy - k_alpha_energy) <= tolerance:
                    line_flux = peak_amplitude * np.sqrt(2 * np.pi) * peak_sigma
                    
                    matched_elements[atomic_num] = {
                        'measured_energy': peak_energy,
                        'expected_energy': k_alpha_energy,
                        'sigma': peak_sigma,
                        'raw_flux': line_flux,
                        'corrected_flux': line_flux  # Default if no ARF
                    }
        
        return matched_elements

    energy, counts,real_, back = load_spectrum_data(spectrum_file, background_file)
    peaks_info = identify_peaks(energy, counts)
    matched_elements = match_peaks_to_elements(peaks_info, k_alpha_lines)

    with fits.open(spectrum_file) as hdul:
        header = hdul[1].header  # Assuming relevant data is in the second HDU

        # Extract coordinates from the FITS header
        v0_lat = header['V0_LAT']
        v1_lat = header['V1_LAT']
        v2_lat = header['V2_LAT']
        v3_lat = header['V3_LAT']
        v0_lon = header['V0_LON']
        v1_lon = header['V1_LON']
        v2_lon = header['V2_LON']
        v3_lon = header['V3_LON']

    # Extract raw fluxes for required elements, assigning 0 if not present
    raw_fluxes = {
                11: matched_elements.get(11, {'raw_flux': 0})['raw_flux'],  # Na
                13: matched_elements.get(13, {'raw_flux': 0})['raw_flux'],  # Al
                14: matched_elements.get(14, {'raw_flux': 0})['raw_flux'],  # Si
                12: matched_elements.get(12, {'raw_flux': 0})['raw_flux'],  # Mg
                20: matched_elements.get(20, {'raw_flux': 0})['raw_flux']   # Ca
            }
    measured_energy = {
                11: matched_elements.get(11, {'measured_energy': 0})['measured_energy'],  # Na
                13: matched_elements.get(13, {'measured_energy': 0})['measured_energy'],  # Al
                14: matched_elements.get(14, {'measured_energy': 0})['measured_energy'],  # Si
                12: matched_elements.get(12, {'measured_energy': 0})['measured_energy'],  # Mg
                20: matched_elements.get(20, {'measured_energy': 0})['measured_energy']   # Ca
            }
    expected_energy = {
                11: matched_elements.get(11, {'expected_energy': 0})['expected_energy'],  # Na
                13: matched_elements.get(13, {'expected_energy': 0})['expected_energy'],  # Na
                14: matched_elements.get(14, {'expected_energy': 0})['expected_energy'],  # Si
                12: matched_elements.get(12, {'expected_energy': 0})['expected_energy'],  # Mg
                20: matched_elements.get(20, {'expected_energy': 0})['expected_energy']   # Ca
            }

            # Calculate flux ratios
    na_si_ratio = raw_fluxes[11] / raw_fluxes[14] if raw_fluxes[14] != 0 and  raw_fluxes[11] else 0  # Na/Si
    al_si_ratio = raw_fluxes[13] / raw_fluxes[14] if raw_fluxes[14] != 0 and  raw_fluxes[13] else 0  # Al/Si
    mg_si_ratio = raw_fluxes[12] / raw_fluxes[14] if raw_fluxes[14] != 0 and  raw_fluxes[12] else 0  # Mg/Si
    ca_si_ratio = raw_fluxes[20] / raw_fluxes[14] if raw_fluxes[14] != 0 and  raw_fluxes[20] else 0  # Ca/Si
    na_si_uncer = abs(measured_energy[11] - expected_energy[11]) * abs(measured_energy[14] - expected_energy[14]) if raw_fluxes[14] != 0 and  raw_fluxes[11] else -1  # Na/Si
    al_si_uncer = abs(measured_energy[13] - expected_energy[13]) * abs(measured_energy[14] - expected_energy[14]) if raw_fluxes[14] != 0 and  raw_fluxes[13] else -1  # Al/Si
    mg_si_uncer = abs(measured_energy[12] - expected_energy[12]) * abs(measured_energy[14] - expected_energy[14]) if raw_fluxes[14] != 0 and  raw_fluxes[12] else -1  # Al/Si
    ca_si_uncer = abs(measured_energy[20] - expected_energy[20]) * abs(measured_energy[14] - expected_energy[14]) if raw_fluxes[14] != 0 and  raw_fluxes[20] else -1  # Al/Si

    # Append results for this FITS file
    result = {
        "fits_file": spectrum_file,
        "V0_LAT": v0_lat,
        "V1_LAT": v1_lat,
        "V2_LAT": v2_lat,
        "V3_LAT": v3_lat,
        "V0_LON": v0_lon,
        "V1_LON": v1_lon,
        "V2_LON": v2_lon,
        "V3_LON": v3_lon,
        "Na/Si": na_si_ratio,
        "Al/Si": al_si_ratio,
        "Mg/Si": mg_si_ratio,
        "Ca/Si": ca_si_ratio,
        "Na/Si_uncer": na_si_uncer,
        "Al/Si_uncer": al_si_uncer,
        "Mg/Si_uncer": mg_si_uncer,
        "Ca/Si_uncer": ca_si_uncer
    }

    # Convert to JSON
    result_json = json.dumps(result, indent=4)
    return result_json