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
from matplotlib.patches import Circle
import matplotlib
matplotlib.use('Agg')
from matplotlib.colors import LinearSegmentedColormap

def integrate_fits_files(fits_filepaths, output_dir):
    # Ensure the output directory exists
    os.makedirs(output_dir, exist_ok=True)

    # Prepare cumulative counts by channel
    cumulative_counts_by_channel = defaultdict(float)
    total_exposure_time = 0
    # Initialize variables for bounding box
    min_v0_lat, min_v1_lat, min_v2_lat, min_v3_lat = float('inf'), float('inf'), float('inf'), float('inf')
    max_v0_lat, max_v1_lat, max_v2_lat, max_v3_lat = float('-inf'), float('-inf'), float('-inf'), float('-inf')
    min_v0_lon, min_v1_lon, min_v2_lon, min_v3_lon = float('inf'), float('inf'), float('inf'), float('inf')
    max_v0_lon, max_v1_lon, max_v2_lon, max_v3_lon = float('-inf'), float('-inf'), float('-inf'), float('-inf')

    for fits_file in fits_filepaths:
        with fits.open(fits_file) as hdul:
            data = hdul[1].data
            header = hdul[1].header

            if data is not None:
                counts_data = data['COUNTS']
                channel_data = data['CHANNEL']
                exposure_time = header.get('EXPOSURE', 0)

                # Add exposure time for the group
                total_exposure_time += exposure_time

                # Update cumulative counts
                for channel, count in zip(channel_data, counts_data):
                    cumulative_counts_by_channel[channel] += float(count)

                # Update min and max values for latitudes and longitudes
                latitudes = [
                    header.get('V0_LAT'), header.get('V1_LAT'),
                    header.get('V2_LAT'), header.get('V3_LAT')
                ]
                longitudes = [
                    header.get('V0_LON'), header.get('V1_LON'),
                    header.get('V2_LON'), header.get('V3_LON')
                ]

                min_v0_lat = min(min_v0_lat, float(latitudes[0]))
                min_v1_lat = min(min_v1_lat, float(latitudes[1]))
                min_v2_lat = min(min_v2_lat, float(latitudes[2]))
                min_v3_lat = min(min_v3_lat, float(latitudes[3]))
                max_v0_lat = max(max_v0_lat, float(latitudes[0]))
                max_v1_lat = max(max_v1_lat, float(latitudes[1]))
                max_v2_lat = max(max_v2_lat, float(latitudes[2]))
                max_v3_lat = max(max_v3_lat, float(latitudes[3]))

                min_v0_lon = min(min_v0_lon, float(longitudes[0]))
                min_v1_lon = min(min_v1_lon, float(longitudes[1]))
                min_v2_lon = min(min_v2_lon, float(longitudes[2]))
                min_v3_lon = min(min_v3_lon, float(longitudes[3]))
                max_v0_lon = max(max_v0_lon, float(longitudes[0]))
                max_v1_lon = max(max_v1_lon, float(longitudes[1]))
                max_v2_lon = max(max_v2_lon, float(longitudes[2]))
                max_v3_lon = max(max_v3_lon, float(longitudes[3]))

    # Prepare data for the FITS file
    channels = list(cumulative_counts_by_channel.keys())
    summed_counts = list(cumulative_counts_by_channel.values())
    energy_list = [channel * 0.0135 for channel in channels]

    # Define the output FITS filename
    first_file_name = os.path.basename(fits_filepaths[0])
    start_time_str = first_file_name.split('.')[0].split('_')[3]
    start_time = datetime.strptime(start_time_str, '%Y%m%dT%H%M%S%f')
    output_fits_file = os.path.join(output_dir, f"integrated_fits_{start_time.strftime('%Y%m%dT%H%M%S')}.fits")

    # Write the integrated FITS file
    hdu = fits.PrimaryHDU()
    columns = [
        fits.Column(name='CHANNEL', format='J', array=np.array(channels)),
        fits.Column(name='ENERGY', format='E', array=np.array(energy_list)),
        fits.Column(name='SUMMED_COUNTS', format='E', array=np.array(summed_counts)),
    ]
    table_hdu = fits.BinTableHDU.from_columns(columns)

    # Add parameters to the header of the FITS file
    table_hdu.header['EXPOSURE'] = total_exposure_time
    table_hdu.header['V0_LAT'] = max_v0_lat
    table_hdu.header['V1_LAT'] = min_v1_lat
    table_hdu.header['V2_LAT'] = min_v2_lat
    table_hdu.header['V3_LAT'] = max_v3_lat
    table_hdu.header['V0_LON'] = max_v0_lon
    table_hdu.header['V1_LON'] = min_v1_lon
    table_hdu.header['V2_LON'] = min_v2_lon
    table_hdu.header['V3_LON'] = max_v3_lon

    hdul = fits.HDUList([hdu, table_hdu])
    hdul.writeto(output_fits_file, overwrite=True)

    return output_fits_file

def Extract_data(spectrum_file,background_dir,background_file=None,):
    if background_file==None:
        month = os.path.basename(spectrum_file).split('fits_')[1][4:6]
        for i in os.listdir(background_dir):
            if(i.split('.')[0].split('_')[-1] == month):
                background_file = os.path.join(background_dir,i)
    
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
            counts = spectrum_data['SUMMED_COUNTS']
            time = hdul[1].header['EXPOSURE']
            
        energy = np.array([13.58 * c / 1000 for c in channels])
        counts = np.array([c / time for c in counts])

        valid_indices = (channels >= 37) & (channels < 299)
        channels = channels[valid_indices]
        energy = energy[valid_indices]
        counts = counts[valid_indices]

        if background_file:
            with fits.open(background_file) as bkg_hdul:
                background_data = bkg_hdul[1].data
            background_counts = background_data['MEAN_COUNTS'] 
            background_counts = background_counts[37:299]
            corrected_counts =counts - background_counts
        # plt.plot(energy,corrected_counts)
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

    return result

def get_heatmap(json_data):
    lat_range = (-90, 90)
    lon_range = (-180, 180)
    img_width = 10726  # Desired width of the output image in pixels
    img_height = 5360  # Desired height of the output image in pixels

    # Load data from the CSV file
    # csv_file = '/home/user/Desktop/INTER_IIT/csv/2020/Catalogue_3_2020 copy.csv'  # Update with the actual CSV file path
    # df = pd.read_csv(csv_file)

    # List of ratios to plot
    ratios = ["Na/Si", "Al/Si", "Mg/Si", "Ca/Si"]
    manual_ranges = {
        "Na/Si": (0, 2),   # Replace these with the desired min/max ranges
        "Al/Si": (0, 2),
        "Mg/Si": (0, 2),
        "Ca/Si": (0, 2)
    }
    heatmap = {}
    colors = {
            "Al/Si": 'red',
            "Ca/Si": 'blue',
            "Mg/Si": 'green',
            "Na/Si": 'white',
        }
    # Iterate over each ratio and create a heatmap
    for ratio in ratios:
        # Set the DPI to get the exact pixel size
        dpi = 1000  # Higher DPI for better quality

        # Calculate figsize (in inches) for the desired pixel dimensions
        figsize = (img_width / dpi, img_height / dpi)  # Convert pixel dimensions to inches

        # Create a transparent figure with the specified dimensions
        fig, ax = plt.subplots(figsize=figsize, dpi=dpi)
        ax.set_facecolor('none')  # Transparent background

        # Configure the plot axes to match the lat/lon range
        ax.set_xlim(lon_range)
        ax.set_ylim(lat_range)
        ax.axis('off')  # Remove axes, labels, and ticks

        # Use the manual range if specified, otherwise fallback to automatic
        if ratio in manual_ranges:
            min_val, max_val = manual_ranges[ratio]
        else:
            min_val, max_val = json_data[ratio].min(), json_data[ratio].max()
        norm = plt.Normalize(min_val, max_val)  # Normalize based on manual or automatic range         

        # ]
        # cmap = LinearSegmentedColormap.from_list('custom_cmap', colors)
        cmap = plt.cm.turbo  # Choose a colormap

        # Iterate over each row in the CSV to extract coordinates and plot the heatmap
        # Extract the coordinates from the CSV row
        v0_lat, v1_lat, v2_lat, v3_lat = json_data["V0_LAT"], json_data["V1_LAT"], json_data["V2_LAT"], json_data["V3_LAT"]
        v0_lon, v1_lon, v2_lon, v3_lon = json_data["V0_LON"], json_data["V1_LON"], json_data["V2_LON"], json_data["V3_LON"]
        
        # Coordinates for the bounding box
        bounding_box_lons = [v0_lon, v1_lon, v2_lon, v3_lon, v0_lon]
        bounding_box_lats = [v0_lat, v1_lat, v2_lat, v3_lat, v0_lat]
        
        # Get the ratio value for the current row
        ratio_value = json_data[ratio]
        centroid_lat = (json_data["V0_LAT"] + json_data["V1_LAT"] + json_data["V2_LAT"] + json_data["V3_LAT"]) / 4
        centroid_lon = (json_data["V0_LON"] + json_data["V1_LON"] + json_data["V2_LON"] + json_data["V3_LON"]) / 4
        
        # Plot the filled polygon representing the bounding box with a color based on the ratio value
        ax.fill(bounding_box_lons, bounding_box_lats, color=cmap(norm(ratio_value)), linewidth=0)
        circle = Circle(
            (centroid_lon, centroid_lat),  # Centroid coordinates (lon, lat)
            radius=7,                    # Radius of the circle
            edgecolor=colors[ratio],               # Border color
            linewidth=3,                   # Border width
            fill=False                     # Ensure the circle is not filled
        )
        ax.add_patch(circle)
        # Save the plot with the specified dimensions and a transparent background
        output_path = rf'Heatmaps/Heatmap_{ratio.replace("/", "_")}.png'
        heatmap[ratio] = output_path
        plt.savefig(output_path, transparent=True, bbox_inches='tight', pad_inches=0)
        plt.close(fig)
    return heatmap


def workflow(fits_dir, background_dir, output_dir, background_file):    
    directory_data = os.listdir(fits_dir)
    fits_file = []
    for file in directory_data:
        if(file.endswith('.fits')):
            fits_file.append(os.path.join(fits_dir,file))    
    summed_spectrum = integrate_fits_files(fits_file, output_dir)

    json_data = Extract_data(summed_spectrum, background_dir, background_file)    
    heatmap_dict = get_heatmap(json_data) 
    print(heatmap_dict)
    return heatmap_dict   

