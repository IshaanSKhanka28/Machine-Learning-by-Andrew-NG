import numpy as np
import matplotlib.pyplot as plt
from lab_utils_multi import zscore_normalize_features, run_gradient_descent_feng

np.set_printoptions(precision=2)

# Intercept plt.show() to save plots as files and prevent blocking
plot_names = [
    "poly_no_feature_engineering.png",
    "poly_added_x2_feature.png",
    "poly_x_x2_x3_features.png",
    "poly_features_linearity.png",
    "poly_normalized_x_x2_x3_feature.png",
    "poly_complex_function_fit.png"
]
plot_index = 0

def my_show(*args, **kwargs):
    global plot_index
    if plot_index < len(plot_names):
        filename = plot_names[plot_index]
    else:
        filename = f"poly_plot_{plot_index + 1}.png"
    plt.savefig(filename, bbox_inches='tight')
    print(f"Plot saved successfully to: {filename}")
    plot_index += 1
    plt.close()

plt.show = my_show

def run_lab():
    print("--- 1. Simple Quadratic (No Feature Engineering) ---")
    x = np.arange(0, 20, 1)
    y = 1 + x**2
    X = x.reshape(-1, 1)
    model_w, model_b = run_gradient_descent_feng(X, y, iterations=1000, alpha=1e-2)
    
    plt.scatter(x, y, marker='x', c='r', label="Actual Value")
    plt.title("no feature engineering")
    plt.plot(x, X@model_w + model_b, label="Predicted Value")
    plt.xlabel("X")
    plt.ylabel("y")
    plt.legend()
    plt.show()
    print()

    print("--- 2. Swap X for X**2 Feature Engineering ---")
    x = np.arange(0, 20, 1)
    y = 1 + x**2
    X = (x**2).reshape(-1, 1)
    model_w, model_b = run_gradient_descent_feng(X, y, iterations=10000, alpha=1e-5)
    
    plt.scatter(x, y, marker='x', c='r', label="Actual Value")
    plt.title("Added x**2 feature")
    plt.plot(x, np.dot(X, model_w) + model_b, label="Predicted Value")
    plt.xlabel("x")
    plt.ylabel("y")
    plt.legend()
    plt.show()
    print()

    print("--- 3. Multiple Potential Features: x, x**2, x**3 ---")
    x = np.arange(0, 20, 1)
    y = x**2
    X = np.c_[x, x**2, x**3]
    model_w, model_b = run_gradient_descent_feng(X, y, iterations=10000, alpha=1e-7)
    
    plt.scatter(x, y, marker='x', c='r', label="Actual Value")
    plt.title("x, x**2, x**3 features")
    plt.plot(x, X@model_w + model_b, label="Predicted Value")
    plt.xlabel("x")
    plt.ylabel("y")
    plt.legend()
    plt.show()
    print()

    print("--- 4. Visualizing Linear Relationship of Features vs Target ---")
    X_features = ['x', 'x^2', 'x^3']
    fig, ax = plt.subplots(1, 3, figsize=(12, 3), sharey=True)
    for i in range(len(ax)):
        ax[i].scatter(X[:, i], y)
        ax[i].set_xlabel(X_features[i])
    ax[0].set_ylabel("y")
    plt.show()
    print()

    print("--- 5. Scaling Features and Applying Gradient Descent ---")
    x = np.arange(0, 20, 1)
    y = x**2
    X = np.c_[x, x**2, x**3]
    print(f"Peak to Peak range by column in Raw        X:{np.ptp(X,axis=0)}")
    X_norm = zscore_normalize_features(X)     
    print(f"Peak to Peak range by column in Normalized X:{np.ptp(X_norm,axis=0)}")
    
    model_w, model_b = run_gradient_descent_feng(X_norm, y, iterations=100000, alpha=1e-1)
    
    plt.scatter(x, y, marker='x', c='r', label="Actual Value")
    plt.title("Normalized x x**2, x**3 feature")
    plt.plot(x, X_norm@model_w + model_b, label="Predicted Value")
    plt.xlabel("x")
    plt.ylabel("y")
    plt.legend()
    plt.show()
    print()

    print("--- 6. Complex Non-Linear Function: y = cos(x/2) ---")
    x = np.arange(0, 20, 1)
    y = np.cos(x/2)
    X = np.c_[x, x**2, x**3, x**4, x**5, x**6, x**7, x**8, x**9, x**10, x**11, x**12, x**13]
    X_norm = zscore_normalize_features(X) 
    
    model_w, model_b = run_gradient_descent_feng(X_norm, y, iterations=1000000, alpha=1e-1)
    
    plt.scatter(x, y, marker='x', c='r', label="Actual Value")
    plt.title("Complex function fit: y = cos(x/2)")
    plt.plot(x, X_norm@model_w + model_b, label="Predicted Value")
    plt.xlabel("x")
    plt.ylabel("y")
    plt.legend()
    plt.show()
    print()

if __name__ == "__main__":
    run_lab()
