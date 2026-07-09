import numpy as np
import matplotlib.pyplot as plt
from lab_utils_multi import load_house_data, run_gradient_descent 
from lab_utils_multi import norm_plot, plt_equal_scale, plot_cost_i_w
from lab_utils_common import dlc

# Set printing options
np.set_printoptions(precision=2)

# Intercept plt.show() to save plots as files and prevent blocking
plot_names = [
    "features_vs_price.png",
    "learning_rate_9.9e-7.png",
    "learning_rate_9.0e-7.png",
    "learning_rate_1.0e-7.png",
    "zscore_normalization_comparison.png",
    "distribution_before_normalization.png",
    "distribution_after_normalization.png",
    "predictions_vs_targets.png",
    "cost_contours_scale_comparison.png"
]
plot_index = 0

def my_show(*args, **kwargs):
    global plot_index
    if plot_index < len(plot_names):
        filename = plot_names[plot_index]
    else:
        filename = f"plot_{plot_index + 1}.png"
    plt.savefig(filename, bbox_inches='tight')
    print(f"Plot saved successfully to: {filename}")
    plot_index += 1
    plt.close()

plt.show = my_show

def zscore_normalize_features(X):
    """
    computes  X, zcore normalized by column
    
    Args:
      X (ndarray (m,n))     : input data, m examples, n features
      
    Returns:
      X_norm (ndarray (m,n)): input normalized by column
      mu (ndarray (n,))     : mean of each feature
      sigma (ndarray (n,))  : standard deviation of each feature
    """
    mu     = np.mean(X, axis=0)                 # mu will have shape (n,)
    sigma  = np.std(X, axis=0)                  # sigma will have shape (n,)
    X_norm = (X - mu) / sigma      

    return (X_norm, mu, sigma)

def run_lab():
    print("--- 1. Load the Dataset ---")
    X_train, y_train = load_house_data()
    X_features = ['size(sqft)','bedrooms','floors','age']
    print(f"Dataset Loaded. X_train shape: {X_train.shape}, y_train shape: {y_train.shape}")
    print()

    print("--- 2. Scatter Plot Features vs Price ---")
    fig, ax = plt.subplots(1, 4, figsize=(12, 3), sharey=True)
    for i in range(len(ax)):
        ax[i].scatter(X_train[:,i], y_train)
        ax[i].set_xlabel(X_features[i])
    ax[0].set_ylabel("Price (1000's)")
    plt.show()
    print()

    print("--- 3. Run Gradient Descent: Learning Rate alpha = 9.9e-7 ---")
    _, _, hist = run_gradient_descent(X_train, y_train, 10, alpha=9.9e-7)
    plot_cost_i_w(X_train, y_train, hist)
    print()

    print("--- 4. Run Gradient Descent: Learning Rate alpha = 9e-7 ---")
    _, _, hist = run_gradient_descent(X_train, y_train, 10, alpha=9e-7)
    plot_cost_i_w(X_train, y_train, hist)
    print()

    print("--- 5. Run Gradient Descent: Learning Rate alpha = 1e-7 ---")
    _, _, hist = run_gradient_descent(X_train, y_train, 10, alpha=1e-7)
    plot_cost_i_w(X_train, y_train, hist)
    print()

    print("--- 6. Step-by-Step Z-Score Normalization Scatter Plots ---")
    mu = np.mean(X_train, axis=0)   
    sigma = np.std(X_train, axis=0) 
    X_mean = (X_train - mu)
    X_norm = (X_train - mu)/sigma      

    fig, ax = plt.subplots(1, 3, figsize=(12, 3))
    ax[0].scatter(X_train[:,0], X_train[:,3])
    ax[0].set_xlabel(X_features[0])
    ax[0].set_ylabel(X_features[3])
    ax[0].set_title("unnormalized")
    ax[0].axis('equal')

    ax[1].scatter(X_mean[:,0], X_mean[:,3])
    ax[1].set_xlabel(X_features[0])
    ax[1].set_ylabel(X_features[3])
    ax[1].set_title(r"X - $\mu$")
    ax[1].axis('equal')

    ax[2].scatter(X_norm[:,0], X_norm[:,3])
    ax[2].set_xlabel(X_features[0])
    ax[2].set_ylabel(X_features[3])
    ax[2].set_title(r"Z-score normalized")
    ax[2].axis('equal')
    plt.tight_layout(rect=[0, 0.03, 1, 0.95])
    fig.suptitle("distribution of features before, during, after normalization")
    plt.show()
    print()

    print("--- 7. Compare Normalized Range vs Raw Range ---")
    X_norm, X_mu, X_sigma = zscore_normalize_features(X_train)
    print(f"X_mu = {X_mu}, \nX_sigma = {X_sigma}")
    print(f"Peak to Peak range by column in Raw        X:{np.ptp(X_train,axis=0)}")   
    print(f"Peak to Peak range by column in Normalized X:{np.ptp(X_norm,axis=0)}")
    print()

    print("--- 8. Plot Distribution of Features Before and After Normalization ---")
    # Before
    fig, ax = plt.subplots(1, 4, figsize=(12, 3))
    for i in range(len(ax)):
        norm_plot(ax[i], X_train[:,i])
        ax[i].set_xlabel(X_features[i])
    ax[0].set_ylabel("count")
    fig.suptitle("distribution of features before normalization")
    plt.show()

    # After
    fig, ax = plt.subplots(1, 4, figsize=(12, 3))
    for i in range(len(ax)):
        norm_plot(ax[i], X_norm[:,i])
        ax[i].set_xlabel(X_features[i])
    ax[0].set_ylabel("count")
    fig.suptitle("distribution of features after normalization")
    plt.show()
    print()

    print("--- 9. Run Gradient Descent on Normalized Data (alpha = 0.1) ---")
    w_norm, b_norm, hist = run_gradient_descent(X_norm, y_train, 1000, 1.0e-1)
    print(f"Final parameters w_norm: {w_norm}, b_norm: {b_norm:.2f}")
    print()

    print("--- 10. Predict Target vs Predictions Plot ---")
    m = X_norm.shape[0]
    yp = np.zeros(m)
    for i in range(m):
        yp[i] = np.dot(X_norm[i], w_norm) + b_norm

    fig, ax = plt.subplots(1, 4, figsize=(12, 3), sharey=True)
    for i in range(len(ax)):
        ax[i].scatter(X_train[:,i], y_train, label='target')
        ax[i].set_xlabel(X_features[i])
        ax[i].scatter(X_train[:,i], yp, color=dlc["dlorange"], label='predict')
    ax[0].set_ylabel("Price")
    ax[0].legend()
    fig.suptitle("target versus prediction using z-score normalized model")
    plt.show()
    print()

    print("--- 11. Predict Specific House Price ---")
    # Predict price of a house with 1200 sqft, 3 bedrooms, 1 floor, 40 years old
    x_house = np.array([1200, 3, 1, 40])
    x_house_norm = (x_house - X_mu) / X_sigma
    print(f"Normalized house input: {x_house_norm}")
    x_house_predict = np.dot(x_house_norm, w_norm) + b_norm
    print(f"Predicted price of a house with 1200 sqft, 3 bedrooms, 1 floor, 40 years old = ${x_house_predict*1000:0.0f}")
    print()

    print("--- 12. Compare Cost Contours (Equal Scale) ---")
    plt_equal_scale(X_train, X_norm, y_train)
    print()

if __name__ == "__main__":
    run_lab()
