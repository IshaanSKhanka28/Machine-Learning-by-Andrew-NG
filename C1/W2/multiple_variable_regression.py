import copy
import math
import numpy as np
import matplotlib.pyplot as plt

# Try to set print options and use deeplearning style if available
np.set_printoptions(precision=2)
try:
    plt.style.use('./deeplearning.mplstyle')
except Exception:
    # Fallback to a default clean style if deeplearning.mplstyle is not found
    plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')

def predict_single_loop(x, w, b): 
    """
    single predict using linear regression
    
    Args:
      x (ndarray): Shape (n,) example with multiple features
      w (ndarray): Shape (n,) model parameters    
      b (scalar):  model parameter     
      
    Returns:
      p (scalar):  prediction
    """
    n = x.shape[0]
    p = 0
    for i in range(n):
        p_i = x[i] * w[i]  
        p = p + p_i         
    p = p + b                
    return p

def predict(x, w, b): 
    """
    single predict using linear regression
    Args:
      x (ndarray): Shape (n,) example with multiple features
      w (ndarray): Shape (n,) model parameters   
      b (scalar):             model parameter 
      
    Returns:
      p (scalar):  prediction
    """
    p = np.dot(x, w) + b     
    return p    

def compute_cost(X, y, w, b): 
    """
    compute cost
    Args:
      X (ndarray (m,n)): Data, m examples with n features
      y (ndarray (m,)) : target values
      w (ndarray (n,)) : model parameters  
      b (scalar)       : model parameter
      
    Returns:
      cost (scalar): cost
    """
    m = X.shape[0]
    cost = 0.0
    for i in range(m):                                
        f_wb_i = np.dot(X[i], w) + b
        cost = cost + (f_wb_i - y[i])**2
    cost = cost / (2 * m)
    return cost

def compute_gradient(X, y, w, b): 
    """
    Computes the gradient for linear regression 
    Args:
      X (ndarray (m,n)): Data, m examples with n features
      y (ndarray (m,)) : target values
      w (ndarray (n,)) : model parameters  
      b (scalar)       : model parameter
      
    Returns:
      dj_dw (ndarray (n,)): The gradient of the cost w.r.t. the parameters w. 
      dj_db (scalar):       The gradient of the cost w.r.t. the parameter b. 
    """
    m,n = X.shape
    dj_dw = np.zeros((n,))
    dj_db = 0.

    for i in range(m):                             
        err = (np.dot(X[i], w) + b) - y[i]   
        for j in range(n):                         
            dj_dw[j] = dj_dw[j] + err * X[i, j]    
        dj_db = dj_db + err                        
    dj_dw = dj_dw / m                                
    dj_db = dj_db / m                                
        
    return dj_db, dj_dw

def gradient_descent(X, y, w_in, b_in, cost_function, gradient_function, alpha, num_iters): 
    """
    Performs batch gradient descent to learn w and b. Updates w and b by taking 
    num_iters gradient steps with learning rate alpha
    
    Args:
      X (ndarray (m,n))   : Data, m examples with n features
      y (ndarray (m,))    : target values
      w_in (ndarray (n,)) : initial model parameters  
      b_in (scalar)       : initial model parameter
      cost_function       : function to compute cost
      gradient_function   : function to compute the gradient
      alpha (float)       : Learning rate
      num_iters (int)     : number of iterations to run gradient descent
      
    Returns:
      w (ndarray (n,)) : Updated values of parameters 
      b (scalar)       : Updated value of parameter 
      J_history (list) : History of cost values
      """
    J_history = []
    w = copy.deepcopy(w_in)
    b = b_in
    
    for i in range(num_iters):
        # Calculate the gradient and update the parameters
        dj_db, dj_dw = gradient_function(X, y, w, b)   

        # Update Parameters using w, b, alpha and gradient
        w = w - alpha * dj_dw               
        b = b - alpha * dj_db               
      
        # Save cost J at each iteration
        if i<100000:
            J_history.append(cost_function(X, y, w, b))

        # Print cost every at intervals 10 times or as many iterations if < 10
        if i % math.ceil(num_iters / 10) == 0:
            print(f"Iteration {i:4d}: Cost {J_history[-1]:8.2f}   ")
        
    return w, b, J_history

def run_lab():
    print("--- 1. Dataset Initialization ---")
    X_train = np.array([[2104, 5, 1, 45], [1416, 3, 2, 40], [852, 2, 1, 35]])
    y_train = np.array([460, 232, 178])
    print(f"X Shape: {X_train.shape}, X Type:{type(X_train)})")
    print(X_train)
    print(f"y Shape: {y_train.shape}, y Type:{type(y_train)})")
    print(y_train)
    print()

    print("--- 2. Parameter Initialization ---")
    b_init = 785.1811367994083
    w_init = np.array([0.39133535, 18.75376741, -53.36032453, -26.42131618])
    print(f"w_init shape: {w_init.shape}, b_init type: {type(b_init)}")
    print()

    print("--- 3. Single Prediction (Element by Element) ---")
    x_vec = X_train[0,:]
    print(f"x_vec shape {x_vec.shape}, x_vec value: {x_vec}")
    f_wb_loop = predict_single_loop(x_vec, w_init, b_init)
    print(f"Prediction (loop): {f_wb_loop}")
    print()

    print("--- 4. Single Prediction (Vectorized) ---")
    f_wb_vec = predict(x_vec, w_init, b_init)
    print(f"Prediction (vectorized): {f_wb_vec}")
    print()

    print("--- 5. Compute Cost with Multiple Variables ---")
    cost = compute_cost(X_train, y_train, w_init, b_init)
    print(f'Cost at optimal/initial w,b: {cost}')
    print()

    print("--- 6. Compute Gradient with Multiple Variables ---")
    tmp_dj_db, tmp_dj_dw = compute_gradient(X_train, y_train, w_init, b_init)
    print(f'dj_db at initial w,b: {tmp_dj_db}')
    print(f'dj_dw at initial w,b: \n {tmp_dj_dw}')
    print()

    print("--- 7. Gradient Descent Execution ---")
    initial_w = np.zeros_like(w_init)
    initial_b = 0.
    iterations = 1000
    alpha = 5.0e-7
    
    w_final, b_final, J_hist = gradient_descent(X_train, y_train, initial_w, initial_b,
                                                compute_cost, compute_gradient, 
                                                alpha, iterations)
    print(f"b, w found by gradient descent: {b_final:0.2f}, {w_final}")
    
    m, _ = X_train.shape
    for i in range(m):
        pred = np.dot(X_train[i], w_final) + b_final
        print(f"prediction: {pred:0.2f}, target value: {y_train[i]}")
    print()

    print("--- 8. Plotting Cost vs. Iteration ---")
    fig, (ax1, ax2) = plt.subplots(1, 2, constrained_layout=True, figsize=(12, 4))
    ax1.plot(J_hist)
    ax2.plot(100 + np.arange(len(J_hist[100:])), J_hist[100:])
    ax1.set_title("Cost vs. iteration")
    ax2.set_title("Cost vs. iteration (tail)")
    ax1.set_ylabel('Cost')
    ax2.set_ylabel('Cost')
    ax1.set_xlabel('iteration step')
    ax2.set_xlabel('iteration step')
    
    # Save the plot to file so it can be viewed headlessly
    plot_path = "cost_vs_iteration.png"
    plt.savefig(plot_path)
    print(f"Plot saved successfully to: {plot_path}")
    
    # Show plot (works if GUI/VS Code display is active)
    # plt.show()

if __name__ == "__main__":
    run_lab()
