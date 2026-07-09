import numpy as np
import matplotlib.pyplot as plt
from lab_utils_common_w3 import dlc, plot_data, gradient_descent, sigmoid

# Set printing options
np.set_printoptions(precision=2)

# Intercept plt.show() to save plots to file
plot_names = [
    "classification_plots.png",
    "linear_regression_fit.png",
    "linear_regression_with_outlier.png"
]
plot_index = 0

def my_show(*args, **kwargs):
    global plot_index
    if plot_index < len(plot_names):
        filename = plot_names[plot_index]
    else:
        filename = f"classification_plot_{plot_index + 1}.png"
    plt.savefig(filename, bbox_inches='tight')
    print(f"Plot saved successfully to: {filename}")
    plot_index += 1
    plt.close()

plt.show = my_show

def run_lab():
    print("--- 1. Classification Data Sets ---")
    x_train = np.array([0., 1, 2, 3, 4, 5])
    y_train = np.array([0,  0, 0, 1, 1, 1])
    X_train2 = np.array([[0.5, 1.5], [1,1], [1.5, 0.5], [3, 0.5], [2, 2], [1, 2.5]])
    y_train2 = np.array([0, 0, 0, 1, 1, 1])

    pos = y_train == 1
    neg = y_train == 0

    fig, ax = plt.subplots(1, 2, figsize=(8, 3))
    
    # plot 1, single variable
    ax[0].scatter(x_train[pos], y_train[pos], marker='x', s=80, c='red', label="y=1")
    ax[0].scatter(x_train[neg], y_train[neg], marker='o', s=100, label="y=0", facecolors='none', 
                  edgecolors=dlc["dlblue"], lw=3)
    ax[0].set_ylim(-0.08, 1.1)
    ax[0].set_ylabel('y', fontsize=12)
    ax[0].set_xlabel('x', fontsize=12)
    ax[0].set_title('one variable plot')
    ax[0].legend()

    # plot 2, two variables
    plot_data(X_train2, y_train2, ax[1])
    ax[1].axis([0, 4, 0, 4])
    ax[1].set_ylabel('$x_1$', fontsize=12)
    ax[1].set_xlabel('$x_0$', fontsize=12)
    ax[1].set_title('two variable plot')
    ax[1].legend()
    plt.tight_layout()
    plt.show()
    print()

    print("--- 2. Linear Regression on Categorical Data (Initial Fit) ---")
    # We train a linear regression model: f_wb = w*x + b
    # Initialize parameters
    w = np.zeros(1)
    b = 0.0
    
    # Run gradient descent for linear regression (logistic=False)
    # Using the same inputs as standard lab runs
    X = x_train.reshape(-1, 1)
    y = y_train.reshape(-1, 1)
    
    # Run GD for 1000 iterations to match the lab's visual regression fit
    w_final, b_final, _ = gradient_descent(X, y, w, b, 0.01, 1000, logistic=False, lambda_=0, verbose=False)
    print(f"Initial fit: w = {w_final[0]:.2f}, b = {b_final:.2f}")
    
    # Plotting initial linear regression fit
    plt.figure(figsize=(6, 4))
    plt.scatter(x_train[pos], y_train[pos], marker='x', s=80, c='red', label="malignant (y=1)")
    plt.scatter(x_train[neg], y_train[neg], marker='o', s=100, label="benign (y=0)", facecolors='none', 
                edgecolors=dlc["dlblue"], lw=3)
    
    x_range = np.linspace(-1, 6, 100)
    plt.plot(x_range, w_final[0] * x_range + b_final, color=dlc["dlblue"], label="Linear Regression Fit")
    
    # Threshold at 0.5
    plt.axhline(0.5, color='gray', linestyle='--', label="0.5 threshold")
    # The decision boundary is where w*x + b = 0.5 => x = (0.5 - b) / w
    decision_boundary = (0.5 - b_final) / w_final[0]
    plt.axvline(decision_boundary, color='purple', linestyle=':', label=f"Decision Boundary (x={decision_boundary:.2f})")
    
    plt.ylim(-0.175, 1.1)
    plt.xlim(-0.5, 5.5)
    plt.ylabel('y')
    plt.xlabel('Tumor Size')
    plt.title("Linear Regression with 0.5 Threshold")
    plt.legend()
    plt.show()
    print()

    print("--- 3. Linear Regression with Outlier on Far Right ---")
    # Add malignant data points on the far right (near x=10)
    x_train_outlier = np.append(x_train, [10.0])
    y_train_outlier = np.append(y_train, [1.0])
    
    X_outlier = x_train_outlier.reshape(-1, 1)
    y_outlier = y_train_outlier.reshape(-1, 1)
    
    pos_outlier = y_train_outlier == 1
    neg_outlier = y_train_outlier == 0
    
    w = np.zeros(1)
    b = 0.0
    w_outlier, b_outlier, _ = gradient_descent(X_outlier, y_outlier, w, b, 0.01, 1000, logistic=False, lambda_=0, verbose=False)
    print(f"Fit with outlier: w = {w_outlier[0]:.2f}, b = {b_outlier:.2f}")
    
    # Plotting regression with outlier
    plt.figure(figsize=(8, 4))
    plt.scatter(x_train_outlier[pos_outlier], y_train_outlier[pos_outlier], marker='x', s=80, c='red', label="malignant (y=1)")
    plt.scatter(x_train_outlier[neg_outlier], y_train_outlier[neg_outlier], marker='o', s=100, label="benign (y=0)", facecolors='none', 
                edgecolors=dlc["dlblue"], lw=3)
    
    x_range_outlier = np.linspace(-1, 11, 100)
    plt.plot(x_range_outlier, w_outlier[0] * x_range_outlier + b_outlier, color=dlc["dlblue"], label="Linear Regression Fit")
    
    # Threshold at 0.5
    plt.axhline(0.5, color='gray', linestyle='--', label="0.5 threshold")
    # Decision boundary: x = (0.5 - b) / w
    decision_boundary_outlier = (0.5 - b_outlier) / w_outlier[0]
    plt.axvline(decision_boundary_outlier, color='purple', linestyle=':', label=f"Decision Boundary (x={decision_boundary_outlier:.2f})")
    
    plt.ylim(-0.175, 1.1)
    plt.xlim(-0.5, 11.0)
    plt.ylabel('y')
    plt.xlabel('Tumor Size')
    plt.title("Linear Regression failure on outliers (shifts boundary right)")
    plt.legend()
    plt.show()
    print()

if __name__ == "__main__":
    run_lab()
