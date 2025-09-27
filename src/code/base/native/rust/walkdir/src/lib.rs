use neon::prelude::*;
use walkdir::WalkDir;
use std::path::Path;
use serde::{Serialize, Deserialize};

// Structs matching your TypeScript interface
#[derive(Clone, Serialize, Deserialize)]
struct IFolderStructure {
    name: String,
    uri: String,
    #[serde(rename = "type")]
    item_type: String, // "folder" or "file"
    #[serde(rename = "isRoot")]
    is_root: bool,
    children: Vec<IFolderStructure>,
}

#[derive(Deserialize)]
struct WalkdirOptions {
    dir_path: String,
    level: Option<usize>, // None means unlimited depth
}

#[neon::export(json)]
fn walkdir(options: WalkdirOptions) -> Result<IFolderStructure, String> {
    let path = Path::new(&options.dir_path);
    
    if !path.exists() {
        return Err(format!("Path does not exist: {}", options.dir_path));
    }
    
    if !path.is_dir() {
        return Err(format!("Path is not a directory: {}", options.dir_path));
    }
    
    match build_folder_structure(path, &options) {
        Ok(structure) => Ok(structure),
        Err(e) => Err(format!("Error building folder structure: {}", e))
    }
}

fn build_folder_structure(root_path: &Path, options: &WalkdirOptions) -> Result<IFolderStructure, Box<dyn std::error::Error>> {
    let mut walker = WalkDir::new(root_path);
    
    // Set max depth if specified
    if let Some(level) = options.level {
        walker = walker.max_depth(level);
    }
    
    // Create root structure
    let root_name = root_path.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_string();
    
    let root_uri = root_path.to_string_lossy().to_string();
    
    let mut root = IFolderStructure {
        name: root_name,
        uri: root_uri.clone(),
        item_type: "folder".to_string(),
        is_root: true,
        children: Vec::new(),
    };
    
    // Build a map to efficiently organize the tree structure
    let mut path_to_structure: std::collections::HashMap<String, IFolderStructure> = std::collections::HashMap::new();
    let mut all_entries: Vec<walkdir::DirEntry> = Vec::new();
    
    // Collect all entries first
    for entry in walker {
        match entry {
            Ok(entry) => {
                // Skip the root directory itself
                if entry.path() != root_path {
                    all_entries.push(entry);
                }
            }
            Err(e) => {
                eprintln!("Warning: Could not access entry: {}", e);
                continue;
            }
        }
    }
    
    // Sort entries by depth to ensure parents are processed before children
    all_entries.sort_by_key(|entry| entry.depth());
    
    // Process each entry
    for entry in &all_entries {
        let path = entry.path();
        let path_str = path.to_string_lossy().to_string();
        
        let name = path.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string();
        
        let item_type = if entry.file_type().is_dir() {
            "folder"
        } else {
            "file"
        }.to_string();
        
        let structure = IFolderStructure {
            name,
            uri: path_str.clone(),
            item_type,
            is_root: false,
            children: Vec::new(),
        };
        
        path_to_structure.insert(path_str, structure);
    }
    
    // Build the tree structure - fix the borrowing issue
    let mut entries_to_process: Vec<_> = all_entries.iter().collect();
    entries_to_process.sort_by_key(|entry| std::cmp::Reverse(entry.depth())); // Process deepest first
    
    for entry in entries_to_process {
        let path = entry.path();
        let path_str = path.to_string_lossy().to_string();
        
        if let Some(parent_path) = path.parent() {
            let parent_path_str = parent_path.to_string_lossy().to_string();
            
            if parent_path_str == root_uri {
                // This is a direct child of root
                if let Some(child) = path_to_structure.remove(&path_str) {
                    root.children.push(child);
                }
            } else if let Some(child) = path_to_structure.remove(&path_str) {
                // This is a child of another directory
                if let Some(parent_structure) = path_to_structure.get_mut(&parent_path_str) {
                    parent_structure.children.push(child);
                }
            }
        }
    }
    
    // Sort children by name (folders first, then files)
    sort_children_recursive(&mut root);
    
    Ok(root)
}

fn sort_children_recursive(structure: &mut IFolderStructure) {
    // Sort children: folders first, then files, both alphabetically
    structure.children.sort_by(|a, b| {
        match (&a.item_type[..], &b.item_type[..]) {
            ("folder", "file") => std::cmp::Ordering::Less,
            ("file", "folder") => std::cmp::Ordering::Greater,
            _ => a.name.cmp(&b.name),
        }
    });
    
    // Recursively sort children's children
    for child in &mut structure.children {
        if child.item_type == "folder" {
            sort_children_recursive(child);
        }
    }
}
