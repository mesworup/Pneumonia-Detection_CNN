import tensorflow as tf
from tensorflow.keras import layers, models, Input
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.optimizers import Adam
from tensorflow.keras import backend as K
import numpy as np

# ==========================================
# CONSTANTS
# ==========================================
IMG_SIZE = 224
CONFIG = {
    "img_size": 224,
    "lr": 1e-4,
    "gamma": 2.0,       
    "alpha": 0.84
}

# ==========================================
# 2. METRICS & LOSS
# ==========================================

def focal_loss(gamma=2., alpha=0.25):
    def focal_loss_fixed(y_true, y_pred):
        y_pred = K.clip(y_pred, K.epsilon(), 1.0 - K.epsilon())
        pt_1 = tf.where(tf.equal(y_true, 1), y_pred, tf.ones_like(y_pred))
        pt_0 = tf.where(tf.equal(y_true, 0), y_pred, tf.zeros_like(y_pred))
        loss = -K.sum(alpha * K.pow(1. - pt_1, gamma) * K.log(pt_1)) \
               -K.sum((1 - alpha) * K.pow(pt_0, gamma) * K.log(1. - pt_0))
        return loss
    return focal_loss_fixed

def f2_score_metric(y_true, y_pred):
    y_pred = K.round(y_pred)
    tp = K.sum(K.cast(y_true * y_pred, 'float'), axis=0)
    fp = K.sum(K.cast((1 - y_true) * y_pred, 'float'), axis=0)
    fn = K.sum(K.cast(y_true * (1 - y_pred), 'float'), axis=0)
    p = tp / (tp + fp + K.epsilon())
    r = tp / (tp + fn + K.epsilon())
    beta = 2
    f2 = (1 + beta**2) * (p * r) / ((beta**2 * p) + r + K.epsilon())
    return f2

def g_mean_metric(y_true, y_pred):
    y_pred = K.round(y_pred)
    tp = K.sum(K.cast(y_true * y_pred, 'float'), axis=0)
    tn = K.sum(K.cast((1 - y_true) * (1 - y_pred), 'float'), axis=0)
    fp = K.sum(K.cast((1 - y_true) * y_pred, 'float'), axis=0)
    fn = K.sum(K.cast(y_true * (1 - y_pred), 'float'), axis=0)
    sens = tp / (tp + fn + K.epsilon())
    spec = tn / (tn + fp + K.epsilon())
    return K.sqrt(sens * spec)

# ==========================================
# 3. CBAM IMPLEMENTATION
# ==========================================

def cbam_block(x, ratio=8):
    # --- Channel Attention ---
    channel = x.shape[-1]
    # shared_dense1/2 must be created once if we want to share weights? 
    # In the user code, they were created INSIDE the function. 
    # Function calls usually create NEW layers unless reusing objects.
    # But since this is called once per block (and called once in build_model), it's fine.
    
    shared_dense1 = layers.Dense(channel // ratio, activation="relu", kernel_initializer='he_normal', use_bias=True)
    shared_dense2 = layers.Dense(channel, kernel_initializer='he_normal', use_bias=True)
    
    avg_pool = shared_dense2(shared_dense1(layers.Reshape((1,1,channel))(layers.GlobalAveragePooling2D()(x))))
    max_pool = shared_dense2(shared_dense1(layers.Reshape((1,1,channel))(layers.GlobalMaxPooling2D()(x))))
    
    channel_feat = layers.Activation('sigmoid')(layers.Add()([avg_pool, max_pool]))
    x = layers.Multiply()([x, channel_feat])
    
    # --- Spatial Attention ---
    # Using explicit lambda functions as provided
    avg_pool = layers.Lambda(lambda t: tf.reduce_mean(t, axis=-1, keepdims=True))(x)
    max_pool = layers.Lambda(lambda t: tf.reduce_max(t, axis=-1, keepdims=True))(x)
    
    concat = layers.Concatenate(axis=-1)([avg_pool, max_pool])
    
    spatial_feat = layers.Conv2D(1, kernel_size=7, padding='same', activation='sigmoid', kernel_initializer='he_normal', use_bias=False)(concat)
    x = layers.Multiply()([x, spatial_feat])
    
    return x

# ==========================================
# 4. MODEL BUILDER
# ==========================================

def build_model():
    inputs = Input(shape=(CONFIG['img_size'], CONFIG['img_size'], 3))
    
    base = EfficientNetB0(include_top=False, weights='imagenet', input_tensor=inputs)
    # Note: User code set base.trainable = True. 
    # Whether we need to set it to verify weights depends. 
    # Usually loading weights will overwrite trainable status or just weights.
    base.trainable = True 
    
    x = base.output
    
    # Add CBAM
    x = cbam_block(x, ratio=8)
    
    # Head
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(1, activation='sigmoid')(x)
    
    model = models.Model(inputs, outputs, name="EfficientNet_CBAM")
    
    # Compile is needed if we want to evaluate, but for inference strictly it's not required.
    # However, to match the user's exact setup:
    model.compile(
        optimizer=Adam(learning_rate=CONFIG['lr']),
        loss=focal_loss(gamma=CONFIG['gamma'], alpha=CONFIG['alpha']),
        metrics=['accuracy', tf.keras.metrics.Recall(name='recall'), f2_score_metric, g_mean_metric]
    )
    return model
