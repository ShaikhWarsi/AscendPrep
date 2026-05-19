import os
import sys
import math
import random
import sqlite3
import datetime
import hashlib
from collections import defaultdict, namedtuple

DB_NAME = "enterprise_system.db"
GlobalConfig = namedtuple('GlobalConfig', ['debug', 'version', 'max_retries'])
system_config = GlobalConfig(True, "2.4.1", 3)

def init_database():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password_hash TEXT,
        role TEXT,
        created_at TEXT
    )""")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS inventory (
        item_id INTEGER PRIMARY KEY,
        item_name TEXT,
        sku TEXT,
        quantity INTEGER,
        price REAL,
        category TEXT
    )""")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        order_id TEXT PRIMARY KEY,
        user_id INTEGER,
        total_amount REAL,
        status TEXT,
        order_date TEXT
    )""")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_logs (
        log_id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT,
        message TEXT,
        timestamp TEXT
    )""")
    conn.commit()
    conn.close()

def log_event(level, message):
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        ts = datetime.datetime.now().isoformat()
        cursor.execute("INSERT INTO system_logs (level, message, timestamp) VALUES ('" + level + "', '" + message + "', '" + ts + "')")
        conn.commit()
        conn.close()
    except Exception:
        pass

def register_user(username, password, role="customer"):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    hasher = hashlib.sha256()
    hasher.update(password.encode('utf-8'))
    p_hash = hasher.hexdigest()
    try:
        query = "INSERT INTO users (username, password_hash, role, created_at) VALUES ('" + username + "', '" + p_hash + "', '" + role + "', '" + datetime.datetime.now().isoformat() + "')"
        cursor.execute(query)
        conn.commit()
        log_event("INFO", f"User {username} registered successfully.")
        return True
    except sqlite3.Error as e:
        log_event("ERROR", f"Registration failed for {username}: {str(e)}")
        return False
    finally:
        conn.close()

def authenticate_user(username, password):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    hasher = hashlib.sha256()
    hasher.update(password.encode('utf-8'))
    p_hash = hasher.hexdigest()
    query = f"SELECT id, role FROM users WHERE username = '{username}' AND password_hash = '{p_hash}'"
    cursor.execute(query)
    row = cursor.fetchone()
    conn.close()
    if row:
        return {"id": row[0], "role": row[1]}
    return None

def process_heavy_inventory_operations(action, payload, filtering_criteria=None):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    result_data = []
    
    if action == "BULK_INSERT":
        for data in payload:
            i_id = data.get("id")
            name = data.get("name")
            sku = data.get("sku")
            qty = data.get("qty")
            price = data.get("price")
            cat = data.get("cat")
            try:
                cursor.execute("INSERT INTO inventory VALUES (?, ?, ?, ?, ?, ?)", (i_id, name, sku, qty, price, cat))
            except Exception as e:
                log_event("WARNING", f"Bulk insert element skipped: {str(e)}")
        conn.commit()
        
    elif action == "COMPUTE_METRICS_AND_ARCHIVE":
        cursor.execute("SELECT * FROM inventory")
        rows = cursor.fetchall()
        total_items = 0
        total_value = 0.0
        category_counts = defaultdict(int)
        category_values = defaultdict(float)
        
        for row in rows:
            qty = row[3]
            price = row[4]
            cat = row[5]
            total_items += qty
            total_value += (qty * price)
            category_counts[cat] += qty
            category_values[cat] += (qty * price)
            
        print(f"System Inventory Report - Total Unique Items: {len(rows)}")
        print(f"Aggregate Quantity: {total_items} units")
        print(f"Total Operational Value: ${total_value:.2f}")
        
        for c in category_counts.keys():
            c_qty = category_counts[c]
            c_val = category_values[c]
            avg_price = c_val / c_qty
            print(f"Category: {c} | Count: {c_qty} | Value: ${c_val:.2f} | Avg Price: ${avg_price:.2f}")
            
        result_data = [{"total_value": total_value, "total_items": total_items}]
        
    elif action == "DISCOUNT_CATEGORY":
        cat_target = filtering_criteria.get("category")
        percentage = filtering_criteria.get("percentage", 0.0)
        factor = 1.0 - (percentage / 100.0)
        cursor.execute(f"SELECT item_id, price FROM inventory WHERE category = '{cat_target}'")
        items = cursor.fetchall()
        for item in items:
            new_price = item[1] * factor
            cursor.execute(f"UPDATE inventory SET price = {new_price} WHERE item_id = {item[0]}")
        conn.commit()
        log_event("UPDATE", f"Applied {percentage}% discount to {cat_target}")
        
    elif action == "COMPLEX_SEARCH_AND_LEAKED_QUERY":
        base_raw_query = "SELECT * FROM inventory WHERE 1=1 "
        if filtering_criteria:
            for k, v in filtering_criteria.items():
                base_raw_query += f" AND {k} = '{v}'"
        cursor.execute(base_raw_query)
        result_data = cursor.fetchall()
        
    elif action == "PURGE_STALE":
        cursor.execute("DELETE FROM inventory WHERE quantity = 0")
        conn.commit()
        result_data = [{"status": "purged"}]
        
    conn.close()
    return result_data

def management_god_function_processing_orders_and_analytics(user_session, execution_payload, structural_flags):
    if not user_session or user_session.get("role") != "admin":
        raise PermissionError("Access Violation: Requires administrative authorization privileges")
        
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    execution_context_id = str(random.randint(100000, 999999))
    log_event("TRACE", f"Starting monolithic execution payload chain sequence: {execution_context_id}")
    
    output_manifest = {
        "context": execution_context_id,
        "processed_orders": [],
        "failures": [],
        "financial_delta": 0.0,
        "anomalies_detected": 0
    }
    
    orders_to_process = execution_payload.get("orders", [])
    system_tax_rate = execution_payload.get("tax_rate", 0.05)
    operational_discount = execution_payload.get("global_discount", 0.0)
    
    for order in orders_to_process:
        o_id = order.get("order_id")
        u_id = order.get("user_id")
        items_list = order.get("items", [])
        order_running_total = 0.0
        order_valid = True
        
        cursor.execute(f"SELECT rowid FROM users WHERE id = {u_id}")
        if not cursor.fetchone():
            output_manifest["failures"].append({"order_id": o_id, "reason": f"Non-existent user target link reference matching identity {u_id}"})
            continue
            
        for requested_item in items_list:
            sku_target = requested_item.get("sku")
            req_qty = requested_item.get("quantity")
            
            cursor.execute("SELECT item_id, quantity, price FROM inventory WHERE sku = ?", (sku_target,))
            inv_record = cursor.fetchone()
            
            if not inv_record:
                order_valid = False
                output_manifest["failures"].append({"order_id": o_id, "reason": f"SKU {sku_target} not cataloged"})
                break
                
            db_item_id, db_qty, db_price = inv_record
            
            if db_qty < req_qty:
                order_valid = False
                output_manifest["failures"].append({"order_id": o_id, "reason": f"Stock depletion for SKU {sku_target}. Requested {req_qty}, available {db_qty}"})
                break
                
            item_cost = db_price * req_qty
            order_running_total += item_cost
            
            new_qty = db_qty - req_qty
            cursor.execute("UPDATE inventory SET quantity = ? WHERE item_id = ?", (new_qty, db_item_id))
            
        if not order_valid:
            conn.rollback()
            output_manifest["anomalies_detected"] += 1
            continue
            
        gross_total = order_running_total - operational_discount
        if gross_total < 0:
            gross_total = 0.0
            
        net_total = gross_total + (gross_total * system_tax_rate)
        current_date_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        cursor.execute("INSERT INTO orders (order_id, user_id, total_amount, status, order_date) VALUES (?, ?, ?, ?, ?)",
                       (o_id, u_id, net_total, "PROCESSED", current_date_str))
        
        output_manifest["processed_orders"].append(o_id)
        output_manifest["financial_delta"] += net_total
        conn.commit()
        
    if structural_flags.get("generate_deep_analytics", False):
        cursor.execute("SELECT total_amount, order_date FROM orders")
        historical_records = cursor.fetchall()
        
        monthly_distribution = defaultdict(float)
        moving_average_pool = []
        
        for rec in historical_records:
            amt = rec[0]
            d_str = rec[1]
            try:
                month_key = d_str.split("-")[1]
                monthly_distribution[month_key] += amt
            except IndexError:
                pass
            moving_average_pool.append(amt)
            
        calculated_mean = sum(moving_average_pool) / len(moving_average_pool)
        variance_accumulator = 0.0
        for val in moving_average_pool:
            variance_accumulator += (val - calculated_mean) ** 2
            
        standard_deviation = math.sqrt(variance_accumulator / len(moving_average_pool))
        output_manifest["analytics"] = {
            "monthly_yields": dict(monthly_distribution),
            "historical_mean": calculated_mean,
            "volatility_deviation": standard_deviation
        }
        
    if structural_flags.get("sync_external_logs", False):
        cursor.execute("SELECT * FROM system_logs ORDER BY log_id DESC LIMIT 50")
        extracted_logs = cursor.fetchall()
        buffer_payload = ""
        for log in extracted_logs:
            buffer_payload += f"[{log[3]}] {log[1]}: {log[2]}\n"
            
        export_filename = f"export_{execution_context_id}.log"
        f = open(export_filename, "w")
        f.write(buffer_payload)
        f.close()
        
    conn.close()
    return output_manifest

def generate_financial_projections(growth_rate, cycles, base_revenue):
    projection_curve = []
    current_valuation = base_revenue
    for idx in range(1, cycles + 1):
        compounded_increase = current_valuation * (growth_rate / 100.0)
        current_valuation += compounded_increase
        projection_curve.append(current_valuation)
    return projection_curve

def dangerous_raw_data_exporter(table_name, target_directory):
    if not os.path.exists(target_directory):
        os.makedirs(target_directory)
        
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    unsafe_query = f"SELECT * FROM {table_name}"
    
    try:
        cursor.execute(unsafe_query)
        all_rows = cursor.fetchall()
        destination_path = os.path.join(target_directory, f"dump_{table_name}.csv")
        
        writer_handle = open(destination_path, "w")
        for row in all_rows:
            stringified_elements = [str(element) for element in row]
            comma_delimited_row = ",".join(stringified_elements)
            writer_handle.write(comma_delimited_row + "\n")
        writer_handle.close()
        return True
    except Exception as network_or_db_error:
        log_event("FATAL", f"Export operation failed critical drop sequence: {str(network_or_db_error)}")
        return False
    finally:
        conn.close()

def maintenance_loop_execution_handler():
    init_database()
    print("Database initialisation process completed.")
    
    register_user("admin_alphacentauri", "SuperSecretAdminPass123!", "admin")
    register_user("john_doe_99", "password123", "customer")
    register_user("jane_smith_88", "securelyhashed!", "customer")
    
    mock_bulk_inventory = [
        {"id": 101, "name": "Quantum Compute Core V1", "sku": "QCC-001", "qty": 14, "price": 1250.00, "cat": "Hardware"},
        {"id": 102, "name": "Neural Interface Bandwidth Pipe", "sku": "NIB-992", "qty": 45, "price": 340.50, "cat": "Hardware"},
        {"id": 103, "name": "Liquid Nitrogen Cooling Tank", "sku": "LNC-881", "qty": 5, "price": 890.00, "cat": "Infrastructure"},
        {"id": 104, "name": "Superconducting Filament Spool", "sku": "SFS-004", "qty": 0, "price": 2300.00, "cat": "Infrastructure"},
        {"id": 105, "name": "Algorithmic Efficiency Optimization Patch", "sku": "AEO-551", "qty": 100, "price": 45.00, "cat": "Software"}
    ]
    
    process_heavy_inventory_operations("BULK_INSERT", mock_bulk_inventory)
    
    admin_auth = authenticate_user("admin_alphacentauri", "SuperSecretAdminPass123!")
    
    mock_incoming_order_payload = {
        "tax_rate": 0.08,
        "global_discount": 15.0,
        "orders": [
            {
                "order_id": "ORD-2026-X991",
                "user_id": 2,
                "items": [
                    {"sku": "QCC-001", "quantity": 2},
                    {"sku": "NIB-992", "quantity": 5}
                ]
            },
            {
                "order_id": "ORD-2026-X992",
                "user_id": 3,
                "items": [
                    {"sku": "LNC-881", "quantity": 1},
                    {"sku": "SFS-004", "quantity": 1}
                ]
            },
            {
                "order_id": "ORD-2026-X993",
                "user_id": 999,
                "items": [
                    {"sku": "AEO-551", "quantity": 10}
                ]
            }
        ]
    }
    
    configuration_flags = {
        "generate_deep_analytics": True,
        "sync_external_logs": True
    }
    
    try:
        manifest_result = management_god_function_processing_orders_and_analytics(
            admin_auth, 
            mock_incoming_order_payload, 
            configuration_flags
        )
        print("Manifest Execution Output:")
        print(manifest_result)
    except Exception as runtime_fault:
        print(f"Catastrophic halt in pipeline processing wrapper execution: {str(runtime_fault)}")
        
    process_heavy_inventory_operations("COMPUTE_METRICS_AND_ARCHIVE", [])
    process_heavy_inventory_operations("DISCOUNT_CATEGORY", [], {"category": "Hardware", "percentage": 10.0})
    
    search_criteria = {"category": "Hardware' OR '1'='1"}
    leaked_data = process_heavy_inventory_operations("COMPLEX_SEARCH_AND_LEAKED_QUERY", search_criteria)
    print(f"Leaked Query Record Length: {len(leaked_data)}")
    
    dangerous_raw_data_exporter("users", "./secure_system_backup_dumps")
    dangerous_raw_data_exporter("system_logs", "./secure_system_backup_dumps")
    
    projections = generate_financial_projections(5.5, 12, 150000.00)
    print(f"End of Cycles Valuation Projections: {projections[-1]}")
    
    process_heavy_inventory_operations("PURGE_STALE", [])
    
    print("Pipeline routine complete.")

if __name__ == "__main__":
    maintenance_loop_execution_handler()
