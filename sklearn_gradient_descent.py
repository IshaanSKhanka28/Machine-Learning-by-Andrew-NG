import numpy as np
import matplotlib.pyplot as plt
from sklearn.linear_model import SGDRegressor
from sklearn.preprocessing import StandardScaler
from lab_utils_multi import load_house_data
from lab_utils_common import dlc

np.set_printoptions(precision=2)

# Intercept plt.show() to save plot as file
def my_show(*args, **kwargs):
    filename = "sklearn_predictions_vs_targets.png"
    plt.savefig(filename, bbox_inches='tight')
    print(f"Plot saved successfully to: {filename}")
    plt.close()

plt.show = my_show

def run_lab():
    print("--- 1. Load the dataset ---")
    X_train, y_train = load_house_data()
    X_features = ['size(sqft)','bedrooms','floors','age']
    print(f"Dataset Loaded. X_train shape: {X_train.shape}, y_train shape: {y_train.shape}")
    print()

    print("--- 2. Scale/normalize the training data ---")
    scaler = StandardScaler()
    X_norm = scaler.fit_transform(X_train)
    print(f"Peak to Peak range by column in Raw        X:{np.ptp(X_train,axis=0)}")   
    print(f"Peak to Peak range by column in Normalized X:{np.ptp(X_norm,axis=0)}")
    print()

    print("--- 3. Create and fit the regression model using SGDRegressor ---")
    sgdr = SGDRegressor(max_iter=1000)
    sgdr.fit(X_norm, y_train)
    print(sgdr)
    print(f"Number of iterations completed: {sgdr.n_iter_}, number of weight updates: {sgdr.t_}")
    print()

    print("--- 4. View model parameters ---")
    b_norm = sgdr.intercept_
    w_norm = sgdr.coef_
    print(f"model parameters:                   w: {w_norm}, b:{b_norm}")
    print( "model parameters from previous lab: w: [110.56 -21.27 -32.71 -37.97], b: 363.16")
    print()

    print("--- 5. Make predictions ---")
    y_pred_sgd = sgdr.predict(X_norm)
    y_pred = np.dot(X_norm, w_norm) + b_norm  
    print(f"prediction using np.dot() and sgdr.predict match: {(y_pred == y_pred_sgd).all()}")
    print(f"Prediction on training set:\n{y_pred[:4]}")
    print(f"Target values \n{y_train[:4]}")
    print()

    print("--- 6. Plot predictions vs targets ---")
    fig, ax = plt.subplots(1, 4, figsize=(12, 3), sharey=True)
    for i in range(len(ax)):
        ax[i].scatter(X_train[:, i], y_train, label='target')
        ax[i].set_xlabel(X_features[i])
        ax[i].scatter(X_train[:, i], y_pred, color=dlc["dlorange"], label='predict')
    ax[0].set_ylabel("Price")
    ax[0].legend()
    fig.suptitle("target versus prediction using z-score normalized model (sklearn)")
    plt.show()
    print()

if __name__ == "__main__":
    run_lab()
